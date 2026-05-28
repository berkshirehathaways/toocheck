/**
 * #14 §1-6 — 공직자윤리위 재산 detail (peti.go.kr).
 * 입력: 성명 (+ 운영자 브라우저 쿠키 + CSRF 토큰)
 * 출력: 8 카테고리별 합계 + 가족 통합 합계 + 부동산 시·도 + 건수 (#14 §3 AssetCategoryBreakdown)
 *
 * privacy 보호:
 *   - 부동산 시·도 단위 + 건수만 저장. 시·군·구·동·지번 비저장. (#14 결정 A)
 *   - 본인 단독 + 본인+가족 통합 합계만. 구성원별 비저장. (#14 결정 B)
 *
 * peti는 NetFunnel + 강력 세션 검증으로 bare fetch 차단. 운영자가 브라우저에서
 *   1) 검색 페이지 진입
 *   2) F12 → Application → Cookies → JSESSIONID 복사
 *   3) HTML 소스에서 csrfToken value 복사
 * 후 환경변수로 주입:
 *   PETI_JSESSIONID=xxx PETI_CSRF=yyy pnpm tsx scripts/ingest/05-fetch-peti.ts 정문헌
 *
 * 또는 향후 Playwright 래퍼 추가 (#15에서 검토).
 */

import { cheonwonToKrw } from './_common.js';

interface PetiCategoryItem {
  name:
    | '토지'
    | '건물'
    | '예금'
    | '증권'
    | '채무'
    | '회원권'
    | '가상자산'
    | '자동차등'
    | '기타';
  totalKrw: number;
  itemCount: number;
  yearOverYearChangeKrw?: number;
}

interface PetiResult {
  asOf: string;
  disclosedAt: string;
  publicNoticeNo: string;
  categories: PetiCategoryItem[];
  realEstateRegions: Array<{ region: string; itemCount: number }>;
  selfOnlyKrw: number;
  selfPlusFamilyKrw: number;
  sourceUrl: string;
}

const BASE = 'https://www.peti.go.kr';

// peti seNm6 → 우리 도메인 카테고리 매핑
const CATEGORY_MAP: Record<string, PetiCategoryItem['name']> = {
  '01.토지': '토지',
  '02.건물': '건물',
  '03.부동산에 관한 규정이 준용되는 권리와 자동차ㆍ건설기계ㆍ선박 및 항공기': '자동차등',
  '05.예금': '예금',
  '07.증권': '증권',
  '09.채무': '채무',
  '13.회원권': '회원권',
  '17. 가상자산': '가상자산',
};

const FAMILY_RNS = new Set([
  '본인',
  '배우자',
  '장남',
  '장녀',
  '차남',
  '차녀',
  '삼남',
  '삼녀',
  '부',
  '모',
  '직계존속',
  '직계비속',
]);

function safeNum(v: unknown): number {
  if (v == null) return 0;
  const cleaned = String(v).replace(/,/g, '').replace(/^-$/, '0');
  const n = Number(cleaned);
  return Number.isNaN(n) ? 0 : n;
}

/** 시도 추출 — 정확 지번·동은 제거. */
function extractSido(addressText: string): string | null {
  const m = addressText.match(
    /(서울특별시|부산광역시|대구광역시|인천광역시|광주광역시|대전광역시|울산광역시|세종특별자치시|경기도|강원특별자치도|충청북도|충청남도|전북특별자치도|전라남도|경상북도|경상남도|제주특별자치도)/
  );
  return m?.[1] ?? null;
}

export async function fetchPetiBreakdown(
  name: string,
  /** 운영자 브라우저에서 복사한 JSESSIONID 쿠키 값. */
  jsessionId: string,
  /** 운영자 브라우저에서 복사한 CSRF 토큰 (검색 페이지 소스에서 추출). */
  csrf: string
): Promise<PetiResult | null> {
  const cookies = `JSESSIONID=${jsessionId}`;

  // 3) 검색 AJAX
  const searchRes = await fetch(`${BASE}/peoptp/getListOptpListVie.do`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
      Cookie: cookies,
      Referer: `${BASE}/peOptpListVie.do`,
    },
    body: new URLSearchParams({
      rgsDtrNm: name,
      fromOptpDt: '2022-01-01',
      toOptpDt: '2026-12-31',
      pageIndex: '1',
      pageUnit: '100',
    }).toString(),
  });
  const searchData = await searchRes.json();
  const records = searchData?.list ?? searchData?.resultList ?? [];
  if (!Array.isArray(records) || records.length === 0) return null;
  const top = records[0];
  const rgsMno = top.rgsMno;
  if (!rgsMno) return null;

  // 4) detail AJAX
  const detailRes = await fetch(`${BASE}/peoptp/getListDetailPrptOptp.do`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
      Cookie: cookies,
      Referer: `${BASE}/peoptp/openPeOptpListVieDtlPop.do`,
    },
    body: new URLSearchParams({ rgsMno: String(rgsMno), csrfToken: csrf }).toString(),
  });
  const detail = await detailRes.json();
  const item = detail?.list?.[0];
  if (!item) return null;

  // 5) 집계
  const ud = item.userData;
  const list = item.optpList ?? [];

  // 카테고리 집계
  const catAgg: Record<
    string,
    { totalKrw: number; itemCount: number; changeKrw: number }
  > = {};
  // 가족별 합계
  const familyAgg: Record<string, number> = {};
  // 부동산 시·도 집계
  const regionAgg: Record<string, number> = {};

  for (const row of list) {
    const cat = CATEGORY_MAP[String(row.seNm6 ?? '')];
    const rn = String(row.rnNm ?? '');
    // 실제 항목 = seq + 가족 구성원
    if (!row.seq || !FAMILY_RNS.has(rn)) continue;

    const prc = safeNum(row.prc);
    const inc = safeNum(row.incAmt);
    const dec = safeNum(row.dcrsAmt);

    if (cat) {
      catAgg[cat] = catAgg[cat] ?? { totalKrw: 0, itemCount: 0, changeKrw: 0 };
      // 채무는 음수 처리
      const signedPrc = cat === '채무' ? -prc : prc;
      catAgg[cat].totalKrw += signedPrc;
      catAgg[cat].itemCount += 1;
      // 증감 = inc - dec (채무는 부호 반전 = 채무 감소가 자산 증가)
      catAgg[cat].changeKrw += cat === '채무' ? dec - inc : inc - dec;
    }

    familyAgg[rn] = (familyAgg[rn] ?? 0) + (cat === '채무' ? -prc : prc);

    // 부동산 시·도 집계 (privacy)
    if (cat === '토지' || cat === '건물') {
      const sido = extractSido(String(row.rghDtlsCts ?? ''));
      if (sido) regionAgg[sido] = (regionAgg[sido] ?? 0) + 1;
    }
  }

  const categories: PetiCategoryItem[] = Object.entries(catAgg).map(([name, agg]) => ({
    name: name as PetiCategoryItem['name'],
    totalKrw: cheonwonToKrw(agg.totalKrw),
    itemCount: agg.itemCount,
    yearOverYearChangeKrw: cheonwonToKrw(agg.changeKrw),
  }));

  const selfOnly = cheonwonToKrw(familyAgg['본인'] ?? 0);
  const selfPlusFamily = cheonwonToKrw(
    Object.values(familyAgg).reduce((a, b) => a + b, 0)
  );

  return {
    asOf: String(ud.rgsSrDt ?? ''),
    disclosedAt: String(ud.optpDt ?? ''),
    publicNoticeNo: String(ud.optpNo ?? ''),
    categories: categories.sort((a, b) => b.totalKrw - a.totalKrw),
    realEstateRegions: Object.entries(regionAgg)
      .map(([region, itemCount]) => ({ region, itemCount }))
      .sort((a, b) => b.itemCount - a.itemCount),
    selfOnlyKrw: selfOnly,
    selfPlusFamilyKrw: selfPlusFamily,
    sourceUrl: `${BASE}/peOptpListVie.do`,
  };
}

async function main() {
  const name = process.argv[2];
  const jsid = process.env.PETI_JSESSIONID;
  const csrf = process.env.PETI_CSRF;
  if (!name || !jsid || !csrf) {
    throw new Error(
      [
        '사용: PETI_JSESSIONID=xxx PETI_CSRF=yyy pnpm tsx 05-fetch-peti.ts <성명>',
        '',
        '쿠키·CSRF 추출 방법:',
        '  1) 브라우저에서 https://www.peti.go.kr/peOptpListVie.do 접속',
        '  2) F12 → Application → Cookies → JSESSIONID 값 복사',
        '  3) 페이지 소스 보기 → id="csrfToken" value="..." 부분 복사',
      ].join('\n')
    );
  }
  const result = await fetchPetiBreakdown(name, jsid, csrf);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith('05-fetch-peti.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export type { PetiResult, PetiCategoryItem };
