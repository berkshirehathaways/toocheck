/**
 * GET /api/districts/by-region?sido=&sigungu=
 *
 * 시·군·구 단위 후보 조회. 그 시·군·구의 모든 후보를 선거별로 묶어 반환.
 * (시·도지사·교육감은 시·도 단위, 구청장·시도의원·구의원은 시·군·구 단위.)
 *
 * 응답: 200 { sido, sigungu, matched, races: [...] }
 *       400 { error }
 */

import { getRegionCandidates } from '@/lib/district/sigungu-candidates';
import { apiError, jsonOk } from '@/lib/api/errors';

export const dynamic = 'force-dynamic';

export function GET(req: Request) {
  const url = new URL(req.url);
  const sido = (url.searchParams.get('sido') ?? '').trim();
  const sigungu = (url.searchParams.get('sigungu') ?? '').trim();
  if (!sido || !sigungu) {
    return apiError('bad_request', '`sido` and `sigungu` query parameters are required.');
  }
  const result = getRegionCandidates(sido, sigungu);
  if (!result.matched) {
    return apiError('not_found', `region ${sido} ${sigungu} not found`);
  }
  return jsonOk(result);
}
