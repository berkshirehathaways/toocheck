import { getCandidate, getDisclosure, listCheckCards, listPromises } from '@/mocks/loader';
import { apiError, jsonOk } from '@/lib/api/errors';

export const dynamic = 'force-static';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const c = getCandidate(id);
  if (!c) return apiError('not_found', `candidate ${id} not found`);
  return jsonOk({
    candidate: c,
    disclosure: getDisclosure(id),
    promises: listPromises(id),
    checkCards: listCheckCards(id),
  });
}
