import { apiError } from '@/lib/api/errors';
import { formatSourceBasis } from '@/lib/format-date';
import { pickSize, pngResponse, renderShareCardPng } from '@/lib/share-card/render';
import { CandidateTemplate } from '@/lib/share-card/templates/candidate';
import { getCandidate, getCompareData, getDisclosure } from '@/mocks/loader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await ctx.params;
  const candidate = getCandidate(candidateId);
  if (!candidate) return apiError('not_found', `candidate ${candidateId} not found`);
  const rows = getCompareData(candidate.districtId);
  const row = rows.find((r) => r.candidate.id === candidateId);
  if (!row) return apiError('not_found', `row not found for ${candidateId}`);
  const disclosure = getDisclosure(candidateId);
  const basisDate = formatSourceBasis(disclosure?.sourceCheckedAt ?? null);
  const size = pickSize(new URL(req.url).searchParams);
  try {
    const png = await renderShareCardPng(
      <CandidateTemplate candidate={candidate} row={row} basisDate={basisDate} />,
      size === 'wide' ? 'square' : size
    );
    return pngResponse(png, `${candidateId}-${size}.png`);
  } catch (e) {
    return apiError('bad_request', `render failed: ${String(e)}`);
  }
}
