import { getDistrict, getDistrictSourceCheckedAt } from '@/mocks/loader';
import { apiError, jsonOk } from '@/lib/api/errors';

export const dynamic = 'force-static';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const d = getDistrict(id);
  if (!d) return apiError('not_found', `district ${id} not found`);
  return jsonOk({ district: d, sourceCheckedAt: getDistrictSourceCheckedAt(id) });
}
