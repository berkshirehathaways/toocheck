import { apiError } from '@/lib/api/errors';
import { formatSourceBasis } from '@/lib/format-date';
import { pickSize, pngResponse, renderShareCardPng } from '@/lib/share-card/render';
import { CompareTemplate } from '@/lib/share-card/templates/compare';
import { getCompareData, getDistrict, getDistrictSourceCheckedAt } from '@/mocks/loader';
import { isSortKey, sortCompareRows } from '@/lib/api/sort';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request, ctx: { params: Promise<{ districtId: string }> }) {
  const { districtId } = await ctx.params;
  const district = getDistrict(districtId);
  if (!district) return apiError('not_found', `district ${districtId} not found`);
  const sortParam = new URL(req.url).searchParams.get('sort');
  const sort = isSortKey(sortParam) ? sortParam : 'ballot';
  const rows = sortCompareRows(getCompareData(districtId), sort);
  const basisDate = formatSourceBasis(getDistrictSourceCheckedAt(districtId));
  const size = pickSize(new URL(req.url).searchParams);
  try {
    const png = await renderShareCardPng(
      <CompareTemplate district={district} rows={rows} basisDate={basisDate} />,
      size === 'wide' ? 'square' : size
    );
    return pngResponse(png, `${districtId}-compare-${sort}-${size}.png`);
  } catch (e) {
    return apiError('bad_request', `render failed: ${String(e)}`);
  }
}
