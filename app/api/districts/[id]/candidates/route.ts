import { getCompareData, getDistrict, listPromises } from '@/mocks/loader';
import { apiError, jsonOk } from '@/lib/api/errors';
import { isSortKey, sortCompareRows, type SortKey } from '@/lib/api/sort';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const d = getDistrict(id);
  if (!d) return apiError('invalid_district', `district ${id} not found`);
  const url = new URL(req.url);
  const sortParam = url.searchParams.get('sort');
  let sort: SortKey = 'ballot';
  if (sortParam) {
    if (!isSortKey(sortParam))
      return apiError('invalid_sort', `unknown sort key: ${sortParam}`);
    sort = sortParam;
  }
  const rows = sortCompareRows(getCompareData(id), sort);
  // 후보 카드에 노출할 상위 공약 2개를 포함
  const enriched = rows.map((r) => ({
    ...r,
    topPromises: listPromises(r.candidate.id)
      .slice()
      .sort((a, b) => b.specificityScore - a.specificityScore || a.orderNo - b.orderNo)
      .slice(0, 2),
  }));
  return jsonOk({ districtId: id, sort, rows: enriched });
}
