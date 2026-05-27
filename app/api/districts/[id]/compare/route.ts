import { getCompareData, getDistrict, getDistrictSourceCheckedAt } from '@/mocks/loader';
import { apiError, jsonOk } from '@/lib/api/errors';
import { isSortKey, sortCompareRows, type SortKey } from '@/lib/api/sort';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const d = getDistrict(id);
  if (!d) return apiError('invalid_district', `district ${id} not found`);
  const sortParam = new URL(req.url).searchParams.get('sort');
  let sort: SortKey = 'ballot';
  if (sortParam) {
    if (!isSortKey(sortParam)) return apiError('invalid_sort', `unknown sort: ${sortParam}`);
    sort = sortParam;
  }
  const rows = sortCompareRows(getCompareData(id), sort);
  return jsonOk({
    districtId: id,
    sort,
    sourceCheckedAt: getDistrictSourceCheckedAt(id),
    rows,
  });
}
