import { listDistricts } from '@/mocks/loader';
import { jsonOk } from '@/lib/api/errors';

export const dynamic = 'force-static';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return jsonOk({ electionId: id, districts: listDistricts(id) });
}
