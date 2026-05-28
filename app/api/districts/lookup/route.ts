/**
 * GET /api/districts/lookup
 *
 * 쿼리 파라미터:
 *   sido       — 시·도명 (필수). 예: "서울특별시"
 *   sigungu    — 시·군·구명 (선택). 예: "종로구"
 *   sigunguCode— 행안부 5자리 시군구 코드 (선택). 예: "11110"
 *   bcode      — 법정동코드 10자리 (선택). 예: "1111010100"
 *   bname      — 법정동명 (선택). 예: "청운동"
 *   zonecode   — 우편번호 5자리 (선택, 로깅·디버그용).
 *
 * 응답:
 *   200 { input, sido, sigungu, offices: [...], meta }
 *   400 { error: { code, message } }
 *
 * 5종 선거(시·도지사 / 교육감 / 구·시·군의 장 / 시·도의원 / 구·시·군의 의원)에 대해
 * 시드 District 매핑 + NEC roster 카운트를 통합 반환한다.
 */

import { resolveDistricts } from '@/lib/district/resolve';
import { apiError, jsonOk } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const url = new URL(req.url);
  const sido = (url.searchParams.get('sido') ?? '').trim();
  if (!sido) {
    return apiError('bad_request', '`sido` query parameter is required.');
  }

  const sigungu = url.searchParams.get('sigungu')?.trim() || undefined;
  const sigunguCode = url.searchParams.get('sigunguCode')?.trim() || undefined;
  const bcode = url.searchParams.get('bcode')?.trim() || undefined;
  const bname = url.searchParams.get('bname')?.trim() || undefined;
  const hname = url.searchParams.get('hname')?.trim() || undefined;
  const zonecode = url.searchParams.get('zonecode')?.trim() || undefined;

  const result = resolveDistricts({
    sidoName: sido,
    sigunguName: sigungu,
    sigunguCode,
    bcode,
    bname,
    hname,
    zonecode,
  });

  return jsonOk(result);
}
