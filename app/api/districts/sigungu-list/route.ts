/**
 * GET /api/districts/sigungu-list
 *
 * 시·군·구 자동완성용 (시·도, 시·군·구) 전체 목록. ~283개.
 */

import { getSigunguList } from '@/lib/district/sigungu-candidates';
import { jsonOk } from '@/lib/api/errors';

export const dynamic = 'force-static';

export function GET() {
  return jsonOk({ sigungu: getSigunguList() });
}
