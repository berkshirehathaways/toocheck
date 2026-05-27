import { getElection } from '@/mocks/loader';
import { apiError, jsonOk } from '@/lib/api/errors';

export const dynamic = 'force-static';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const e = getElection(id);
  if (!e) return apiError('not_found', `election ${id} not found`);
  return jsonOk({ election: e });
}
