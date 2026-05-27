import { apiError } from '@/lib/api/errors';
import { formatSourceBasis } from '@/lib/format-date';
import { pickSize, pngResponse, renderShareCardPng } from '@/lib/share-card/render';
import { RegionTemplate } from '@/lib/share-card/templates/region';
import { getCompareData, getDistrict, getDistrictSourceCheckedAt } from '@/mocks/loader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ districtId: string }> }) {
  const { districtId } = await ctx.params;
  const district = getDistrict(districtId);
  if (!district) return apiError('not_found', `district ${districtId} not found`);
  const rows = getCompareData(districtId);
  const basisDate = formatSourceBasis(getDistrictSourceCheckedAt(districtId));
  const size = pickSize(new URL(req.url).searchParams);
  try {
    const png = await renderShareCardPng(
      <RegionTemplate district={district} rows={rows} basisDate={basisDate} />,
      size === 'wide' ? 'square' : size
    );
    return pngResponse(png, `${districtId}-region-${size}.png`);
  } catch (e) {
    return apiError('bad_request', `render failed: ${String(e)}`);
  }
}
