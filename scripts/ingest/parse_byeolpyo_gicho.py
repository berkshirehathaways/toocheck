#!/usr/bin/env python3
"""
#52 — 기초의원(구·시·군의원) 선거구 조례 별표 파서 (HWP 5.x + HWPX, roster 정답 대조).

각 시·도 "자치구·시·군의원 선거구와 선거구별 의원정수에 관한 조례" 별표에서
기초의원 선거구의 행정동/읍·면 구성을 추출한다.

견고화 전략:
  - 입력 형식 자동 감지: OLE2(HWP 5.x) → 레코드 파싱 / ZIP(HWPX) → section*.xml 파싱.
  - roster-summary.json 의 유효 (시·군·구, sggName) 집합과 대조 → 시군구 오독·표 형식 편차 방지.
    별표 표 구조가 시·도마다 달라도, roster에 존재하는 선거구명만 채택한다.

표 패턴(공통): [시·군·구] [X(가/나) 선거구] [의원정수] [구역(동 목록)] 반복.
  시·군·구 셀이 병합(rowspan)되어 한 번만 나오는 형식도 currentSigungu 추적으로 처리.

사용:
  python3 scripts/ingest/parse_byeolpyo_gicho.py <hwp_or_hwpx_path> "<시도명>"
"""
import os
import re
import sys
import struct
import zlib
import zipfile
import html as _html
import json

EXT_CTRL = {1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 14, 15, 16, 17, 18, 21, 22, 23}
OUT_DIR = os.path.join("data", "raw", "assembly-districts")
ROSTER_SUMMARY = os.path.join("data", "curated", "roster-summary.json")


# ---------- HWP 5.x (OLE2) ----------
def _hwp5_para_texts(data: bytes):
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


def _extract_hwp5(path):
    import olefile
    o = olefile.OleFileIO(path)
    pars = []
    for s in o.listdir():
        if s and s[0] == "BodyText":
            try:
                dec = zlib.decompress(o.openstream("/".join(s)).read(), -15)
            except Exception:
                continue
            pars += _hwp5_para_texts(dec)
    return pars


# ---------- HWPX (ZIP + XML) ----------
def _extract_hwpx(path):
    pars = []
    with zipfile.ZipFile(path) as z:
        secs = sorted(n for n in z.namelist() if re.match(r"Contents/section\d+\.xml$", n))
        for sec in secs:
            xml = z.read(sec).decode("utf-8", "ignore")
            for p in re.findall(r"<hp:p\b.*?</hp:p>", xml, re.S):
                texts = re.findall(r"<hp:t>(.*?)</hp:t>", p, re.S)
                txt = "".join(texts)
                txt = re.sub(r"<[^>]+>", "", txt)
                txt = _html.unescape(txt).strip()
                pars.append(txt)
    return pars


def extract_paragraphs(path):
    with open(path, "rb") as f:
        head = f.read(4)
    if head[:2] == b"PK":  # ZIP → HWPX
        return [p for p in _extract_hwpx(path) if p]
    return [p for p in _extract_hwp5(path) if p]  # OLE2 → HWP 5.x


# ---------- roster 정답 집합 ----------
def load_roster_sets(sido):
    """해당 시·도의 유효 (시·군·구 집합, 정규화 sggName 집합, loose 인덱스) 반환.

    loose: 시/군 약칭 흡수용. "전주시가선거구" → loose 키 "전주가선거구" → 원본 매핑.
    (별표가 "전주가선거구"처럼 시/군을 생략하는 경우 대응. 구는 생략하지 않음: 중구가선거구.)
    """
    data = json.load(open(ROSTER_SUMMARY, encoding="utf-8"))
    sigungus, sggnames, loose = set(), set(), {}
    for info in data["sggIndex"].values():
        if info.get("officeKind") != "basic_member" or info.get("sidoName") != sido:
            continue
        sigungus.add(info["guName"])
        nm = re.sub(r"\s", "", info["sggName"])
        sggnames.add(nm)
        lk = re.sub(r"(시|군)([가-힣])선거구$", r"\2선거구", nm)
        if lk != nm and lk not in loose:
            loose[lk] = nm
    return sigungus, sggnames, loose


def nospace(s):
    # 공백 + 따옴표류 제거 (별표가 "포항시“가”선거구" 처럼 곡선따옴표를 쓰는 경우 대응)
    s = re.sub(r"\s+", "", s)
    return re.sub(r"[\"“”„‟'‘’＂]", "", s)


SGG_LETTER = re.compile(r"^([가-힣]{1,3})\s*선거구$")


def split_region(region):
    # 괄호 안 리(里) 상세 제거
    region = re.sub(r"\([^)]*\)", "", region)
    out = []
    for p in region.split(","):
        p = p.strip()
        # 일반구 접두 제거: "완산구 노송동" → "노송동" (카카오 hname은 동명만 줌)
        p = re.sub(r"^[가-힣]+구\s+", "", p)
        if p:
            out.append(p)
    return out


def match_sgg(pn, cur, sggnames, loose):
    """문단(정규화 pn)을 roster sggName으로 해석. 여러 시·도 표기 형식 흡수. 미해당이면 None.

    형식들:
      A. 전체 이름      "중구가선거구"       → 그대로
      B. 접미사 없음    "천안시 가" → pn="천안시가" → +"선거구"
      C. letter만/letter선거구 + 시군구 헤더  "가"/"가선거구" → cur+letter+선거구
      D. 시/군 약칭     "전주가선거구"        → loose["전주가선거구"]="전주시가선거구"
    """
    if "," in pn or len(pn) > 14:
        return None
    cands = []
    if pn.endswith("선거구"):
        cands.append(pn)  # A
        m = SGG_LETTER.match(pn)  # "가선거구" → letter "가"
        if m and cur:
            cands.append(f"{cur}{m.group(1)}선거구")  # C
    else:
        cands.append(pn + "선거구")  # B: "천안시가" → "천안시가선거구"
        if cur and re.fullmatch(r"[가-힣]{1,3}", pn):
            cands.append(f"{cur}{pn}선거구")  # C: cur + "가"
    for c in cands:
        if c in sggnames:
            return c
    for c in cands + [pn]:  # D: 시/군 약칭 loose
        if c in loose:
            return loose[c]
    return None


def parse(pars, sido):
    sigungus, sggnames, loose = load_roster_sets(sido)
    rows = []
    cur = None
    i, n = 0, len(pars)
    while i < n:
        p = pars[i]
        pn = nospace(p)
        # 시·군·구 헤더 (roster 대조)
        if pn in sigungus:
            cur = pn
            i += 1
            continue
        if re.fullmatch(r"\d+", pn):
            i += 1
            continue
        sgg = match_sgg(pn, cur, sggnames, loose)
        if not sgg:
            i += 1
            continue
        # 의원정수(숫자) 건너뛰고 구역 수집
        j = i + 1
        while j < n and re.fullmatch(r"\d+", nospace(pars[j])):
            j += 1
        region_parts = []
        while j < n:
            cand = pars[j]
            cn = nospace(cand)
            if cn in sigungus or match_sgg(cn, cur, sggnames, loose):
                break
            region_parts.append(cand)
            if not cand.rstrip().endswith(","):
                j += 1
                break
            j += 1
        for dong in split_region(" ".join(region_parts)):
            rows.append((sido, "basic", sgg, dong))
        i = j
    return rows


def main():
    args = [a for a in sys.argv[1:]]
    if len(args) < 2:
        print('usage: parse_byeolpyo_gicho.py <hwp_or_hwpx_path> "<시도명>"')
        sys.exit(1)
    path, sido = args[0], args[1]
    pars = extract_paragraphs(path)
    rows = parse(pars, sido)
    sggs = sorted({r[2] for r in rows})
    print(f"{sido}: 선거구 {len(sggs)} / 동·읍·면 행 {len(rows)} (paragraphs {len(pars)})")
    os.makedirs(OUT_DIR, exist_ok=True)
    out = os.path.join(OUT_DIR, f"gicho_{sido}.csv")
    src = f"https://www.law.go.kr/LSW/ordinInfoP.do (별표) {sido} 기초의원 선거구 조례"
    with open(out, "w", encoding="utf-8") as f:
        f.write("sido,kind,sggName,hdong,sourceUrl\n")
        for s, k, sgg, dong in rows:
            f.write(f"{s},{k},{sgg},{dong},{src}\n")
    print("✓ wrote", out)


if __name__ == "__main__":
    main()
