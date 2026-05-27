import { describe, expect, it } from 'vitest';
import { sortCompareRows } from '@/lib/api/sort';
import { getCompareData } from '@/mocks/loader';

const districtId = 'district_sample_ga';

describe('sort: needs_check 후보는 항상 마지막', () => {
  it('ballot 정렬 시 needs_check는 마지막', () => {
    const rows = sortCompareRows(getCompareData(districtId), 'ballot');
    expect(rows[rows.length - 1]?.candidate.reviewStatus).toBe('needs_check');
  });
  it('asset_desc 정렬 시 needs_check는 마지막', () => {
    const rows = sortCompareRows(getCompareData(districtId), 'asset_desc');
    expect(rows[rows.length - 1]?.candidate.reviewStatus).toBe('needs_check');
    // reviewed 후보들이 자산 내림차순
    const reviewed = rows.filter((r) => r.candidate.reviewStatus === 'reviewed');
    for (let i = 1; i < reviewed.length; i++) {
      const prev = reviewed[i - 1]?.disclosure?.assetTotal ?? 0;
      const curr = reviewed[i]?.disclosure?.assetTotal ?? 0;
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});
