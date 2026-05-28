/**
 * 행정동명·선거구명 정규화 — 별표(법령)와 카카오 우편번호 응답의 표기 차이를 흡수.
 *
 * 빌더(scripts/ingest/11-build-assembly-district-map.ts)와 런타임(resolve.ts)이
 * **동일한 정규화**를 적용해야 매칭된다.
 *
 * 표기 차이 예:
 *   별표 "우제1동"        vs 카카오 "우1동"          → "우1동"
 *   별표 "종로1.2.3.4가동" vs 카카오 "종로1·2·3·4가동" → "종로1234가동"
 *   별표 "종로구제1 선거구" vs roster "종로구제1선거구"  → "종로구제1선거구"
 */

/**
 * 행정동명 정규화.
 * - 공백 제거
 * - 구분자(·, ., ・, ㆍ, 중점류) 제거
 * - 숫자 앞의 "제" 제거 ("우제1동" → "우1동", "창신제1동" → "창신1동")
 *   ※ "제기동"처럼 제 뒤가 숫자가 아니면 보존.
 */
export function normalizeDong(name: string): string {
  if (!name) return '';
  let s = name.trim();
  s = s.replace(/[\s]/g, '');
  s = s.replace(/[·.・ㆍ‧·]/g, '');
  s = s.replace(/제(?=\d)/g, '');
  return s;
}

/** 선거구명 정규화 — 공백만 제거 (별표 "종로구제1 선거구" → "종로구제1선거구"). */
export function normalizeSggName(name: string): string {
  return (name ?? '').replace(/\s/g, '');
}

/**
 * 광역단체장·교육감·광역의원이 통합 시·도명으로 등록된 2026 케이스.
 * 카카오 sido(물리적 시·도) → NEC 등록 통합 시·도명.
 * 동 단위/시·도 단위 매칭에서 양쪽 키를 모두 시도해야 한다.
 */
export const SIDO_INTEGRATION_ALIAS: Record<string, string> = {
  광주광역시: '전남광주통합특별시',
  전라남도: '전남광주통합특별시',
};

/** 카카오 sido → [원본, 통합 alias] 후보 목록. */
export function sidoCandidates(sidoName: string): string[] {
  const alias = SIDO_INTEGRATION_ALIAS[sidoName];
  return alias ? [sidoName, alias] : [sidoName];
}
