#!/usr/bin/env python3
"""
#52 — 공직선거법 별표2 (시·도의회의원 지역선거구 구역표) HWP 파서.

전국 광역의원(시·도의원) 선거구의 행정동/읍·면 구성을 법적 권위 원본에서 추출한다.

입력: law.go.kr 공직선거법 별표2 HWP 파일 (다운로드 URL은 아래 BYEOLPYO2_URL).
출력: data/raw/assembly-districts/gwangyeok_byeolpyo2.csv
      헤더: sido,kind,sggName,hdong,sourceUrl

HWP 5.x(CFB) BodyText/Section0 를 zlib raw-deflate 해제 후 HWPTAG_PARA_TEXT(67) 레코드를
순서대로 디코드해 문단 텍스트를 복원한다. 문단은 [시·도 헤더] / [선거구명] / [구역] 패턴으로 반복.

제주특별자치도는 제주특별법에 별도 규정 → 별표2에 없음(알려진 예외, 시·군·구 fallback 유지).

사용:
  python3 scripts/ingest/parse_byeolpyo2.py                  # 다운로드 후 파싱
  python3 scripts/ingest/parse_byeolpyo2.py path/to/file.hwp # 로컬 파일 파싱
"""
import os
import re
import sys
import struct
import zlib
import urllib.request

BYEOLPYO2_URL = (
    "https://www.law.go.kr/LSW//flDownload.do?"
    "gubun=&flSeq=163897923&bylClsCd=110201"
)
SOURCE_URL = "https://www.law.go.kr/법령/공직선거법 (별표2 시·도의회의원지역선거구구역표)"
OUT_PATH = os.path.join("data", "raw", "assembly-districts", "gwangyeok_byeolpyo2.csv")

# HWPTAG_PARA_TEXT 내 8-wchar 폭을 차지하는 인라인 컨트롤 코드
EXT_CTRL = {1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18, 21, 22, 23}


def para_texts(data: bytes):
    """HWP 5.0 레코드 스트림에서 PARA_TEXT(67) 문단들을 순서대로 복원."""
    pos, n, out = 0, len(data), []
    while pos + 4 <= n:
        header = struct.unpack_from("<I", data, pos)[0]
        pos += 4
        tag = header & 0x3FF
        size = (header >> 20) & 0xFFF
        if size == 0xFFF:
            size = struct.unpack_from("<I", data, pos)[0]
            pos += 4
        payload = data[pos:pos + size]
        pos += size
        if tag != 67:
            continue
        wc = len(payload) // 2
        vals = struct.unpack_from("<%dH" % wc, payload, 0)
        chars, j = [], 0
        while j < wc:
            c = vals[j]
            if c in EXT_CTRL:
                j += 8
                continue
            if c < 32:
                chars.append(" ")
                j += 1
                continue
            chars.append(chr(c))
            j += 1
        out.append("".join(chars).strip())
    return out


def extract_paragraphs(hwp_path: str):
    import olefile
    o = olefile.OleFileIO(hwp_path)
    secs = sorted("/".join(s) for s in o.listdir() if s and s[0] == "BodyText")
    pars = []
    for s in secs:
        raw = o.openstream(s).read()
        try:
            dec = zlib.decompress(raw, -15)
        except Exception:
            dec = raw
        pars += para_texts(dec)
    return [p for p in pars if p]


# "서울특별시의회의원(지역구 : 103)" → "서울특별시"
SIDO_HEADER = re.compile(r"^(.+?(?:특별시|광역시|특별자치시|특별자치도|도))의회의원\s*\(")
# 선거구명: "종로구제1 선거구", "남해군 선거구", "성남시제5 선거구"
SGG_NAME = re.compile(r"선거구$")


def is_sgg_name(line: str) -> bool:
    if not SGG_NAME.search(line):
        return False
    # 컬럼 헤더/표제 제외
    if line in ("선거구역", "선거구명") or "구역표" in line:
        return False
    # 너무 길면(구역 설명) 제외 — 선거구명은 보통 20자 이내
    return len(line) <= 25


def split_region(region: str):
    """구역 문자열 → 동/읍/면 리스트. 괄호 안 리(里) 상세는 제거하고 읍·면·동만."""
    # "거창읍(중앙리, 대동리...)" → "거창읍"
    region = re.sub(r"\([^)]*\)", "", region)
    parts = [p.strip() for p in region.split(",")]
    return [p for p in parts if p]


def parse(pars):
    rows = []
    cur_sido = None
    i = 0
    while i < len(pars):
        line = pars[i]
        m = SIDO_HEADER.match(line)
        if m:
            cur_sido = m.group(1)
            i += 1
            continue
        if cur_sido and is_sgg_name(line):
            # 다음 비어있지 않은 문단이 구역
            region = pars[i + 1] if i + 1 < len(pars) else ""
            sgg = line.replace(" ", "")
            for dong in split_region(region):
                rows.append((cur_sido, "metropolitan", sgg, dong))
            i += 2
            continue
        i += 1
    return rows


def main():
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        hwp_path = sys.argv[1]
    else:
        hwp_path = os.path.join("data", "raw", "byeolpyo2.hwp")
        os.makedirs(os.path.dirname(hwp_path), exist_ok=True)
        print("Downloading 별표2 from law.go.kr ...")
        req = urllib.request.Request(
            BYEOLPYO2_URL,
            headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.law.go.kr/"},
        )
        with urllib.request.urlopen(req) as r:
            open(hwp_path, "wb").write(r.read())
        print("  saved:", hwp_path, os.path.getsize(hwp_path), "bytes")

    pars = extract_paragraphs(hwp_path)
    rows = parse(pars)
    sidos = sorted({r[0] for r in rows})
    sggs = sorted({(r[0], r[2]) for r in rows})
    print("paragraphs:", len(pars))
    print("시·도:", len(sidos), sidos)
    print("선거구:", len(sggs), "| 동·읍·면 행:", len(rows))

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("sido,kind,sggName,hdong,sourceUrl\n")
        for sido, kind, sgg, dong in rows:
            f.write(f"{sido},{kind},{sgg},{dong},{SOURCE_URL}\n")
    print("✓ wrote", OUT_PATH)


if __name__ == "__main__":
    main()
