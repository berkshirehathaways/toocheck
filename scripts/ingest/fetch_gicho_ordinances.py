#!/usr/bin/env python3
"""
#52 — 기초의원 선거구 조례 별표 일괄 수집 오케스트레이터.

REGISTRY(시·도 → 현행 조례 ordinSeq)를 돌며:
  1) ordinInfoR.do?ordinSeq=... 에서 '선거구' 별표의 flSeq 추출
  2) flDownload.do 로 HWP 다운로드
  3) parse_byeolpyo_gicho.parse() 로 파싱 → data/raw/assembly-districts/gicho_<시도>.csv

조례 명칭·별표 형식이 시·도마다 다르므로, 파싱 후 11-build-assembly-district-map.ts의
unresolved 카운터로 품질을 게이팅(검수)한다. 깨끗이 해결되지 않는 시·도는 CSV에서 제외.

ordinSeq 수집: law.go.kr 자치법규 검색(브라우저) → ordinViewAll('<ordinSeq>',...). 현행=마지막 인자 '1'.

사용:
  python3 scripts/ingest/fetch_gicho_ordinances.py            # REGISTRY 전체
  python3 scripts/ingest/fetch_gicho_ordinances.py 서울특별시  # 특정 시·도만
"""
import os
import re
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from parse_byeolpyo_gicho import extract_paragraphs, parse  # noqa: E402

OUT_DIR = os.path.join("data", "raw", "assembly-districts")
RAW_DIR = os.path.join("data", "raw", "gicho-hwp")

# 시·도 → 현행(시행 최신) 조례 ordinSeq. law.go.kr 자치법규 검색에서 수집.
#
# 검증 상태 (11-builder unresolved 0 게이팅 기준):
#   ✓ 검증완료(파싱 정확): 서울특별시, 경상남도
#   △ 표 형식 상이(파서 튜닝 필요): 경기도(0건), 광주광역시(시군구 오독), 강원특별자치도/경상북도(비-OLE 응답)
#   ☐ ordinSeq 미수집: 부산·대구·인천·대전·울산·세종·충북·충남·전북·전남·제주
#
# 시·도마다 조례 별표 표 구조가 달라 parse_byeolpyo_gicho.parse() 의 시·도별 보정이 필요.
# 미검증 시·도는 CSV를 만들지 않으면 자동으로 itemized fallback 유지(부정확 데이터 미배포).
REGISTRY = {
    "서울특별시": "2127439",
    "부산광역시": "2127997",
    "대구광역시": "2127075",
    "대전광역시": "2127079",
    "광주광역시": "2127051",
    "강원특별자치도": "2127433",
    "경기도": "1705363",
    "경상남도": "2127205",
    "경상북도": "2127099",
    # 미수집(추가 예정): 인천·울산·충북·충남·전북·전남
    # 제주·세종은 단층제 → 기초의원 없음(해당 없음).
}


def http_get(url: str) -> bytes:
    req = urllib.request.Request(
        url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.law.go.kr/"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


# 별표 파일명이 비서술적("엘리스자치법규")이라 자동 선택이 안 되는 조례의 직접 지정.
FLSEQ_OVERRIDE = {
    "1705363": "158457477",  # 경기도 2022 조례 별표2(선거구 명칭·구역)
}


def find_byeolpyo_flseq(ordin_seq: str):
    if ordin_seq in FLSEQ_OVERRIDE:
        return FLSEQ_OVERRIDE[ordin_seq]
    """ordinInfoR.do 에서 '선거구' 구역 별표의 flSeq 반환 (없으면 None)."""
    html = http_get(
        f"https://www.law.go.kr/LSW/ordinInfoR.do?ordinSeq={ordin_seq}&gubun=KLAW"
    ).decode("utf-8", "ignore")
    # flDownload 링크들: flSeq + flNm(파일명) 추출
    cands = []
    for m in re.finditer(r"flSeq=(\d+)[^\"']*flNm=([^\"'&]+)", html):
        seq, nm = m.group(1), urllib.parse.unquote(m.group(2))
        cands.append((seq, nm))
    if not cands:
        seqs = re.findall(r"flSeq=(\d+)", html)
        return seqs[0] if seqs else None
    # 선거구 구역 별표 우선순위:
    #  1) "구역" 포함 (예: "별표2 시·군의원 지역구의 명칭·구역")  ← 동 목록 표
    #  2) "선거구" 포함 (서울처럼 의원정수+선거구 통합 별표)
    #  3) "의원정수"만 있는 별표는 회피
    for seq, nm in cands:
        if "구역" in nm:
            return seq
    for seq, nm in cands:
        if "선거구" in nm and "의원정수" not in nm.replace("선거구", ""):
            return seq
    for seq, nm in cands:
        if "선거구" in nm:
            return seq
    return cands[0][0]


import urllib.parse  # noqa: E402


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(RAW_DIR, exist_ok=True)
    src_base = "https://www.law.go.kr/LSW/ordinInfoP.do (별표) "
    summary = []
    for sido, ordin_seq in REGISTRY.items():
        if only and sido != only:
            continue
        try:
            flseq = find_byeolpyo_flseq(ordin_seq)
            if not flseq:
                summary.append((sido, "별표 flSeq 없음", 0, 0))
                continue
            hwp = os.path.join(RAW_DIR, f"gicho_{sido}.hwp")
            open(hwp, "wb").write(
                http_get(f"https://www.law.go.kr/LSW/flDownload.do?gubun=KLAW&flSeq={flseq}")
            )
            pars = extract_paragraphs(hwp)
            rows = parse(pars, sido)
            sggs = sorted({r[2] for r in rows})
            out = os.path.join(OUT_DIR, f"gicho_{sido}.csv")
            src = src_base + f"{sido} 기초의원 선거구 조례 (ordinSeq {ordin_seq})"
            with open(out, "w", encoding="utf-8") as f:
                f.write("sido,kind,sggName,hdong,sourceUrl\n")
                for s, k, sgg, dong in rows:
                    f.write(f"{s},{k},{sgg},{dong},{src}\n")
            summary.append((sido, f"flSeq {flseq}", len(sggs), len(rows)))
        except Exception as e:  # noqa: BLE001
            summary.append((sido, f"ERROR {e}", 0, 0))

    print("\n=== 기초 조례 수집 요약 ===")
    for sido, note, sggs, rows in summary:
        print(f"  {sido:<12} {note:<22} 선거구 {sggs:>3} / 행 {rows:>4}")
    print("\n다음: pnpm tsx scripts/ingest/11-build-assembly-district-map.ts (unresolved 0 확인)")


if __name__ == "__main__":
    main()
