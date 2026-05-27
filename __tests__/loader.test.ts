import { describe, expect, it } from 'vitest';
import {
  getCandidate,
  getCompareData,
  getDistrict,
  getDistrictSourceCheckedAt,
  listCandidates,
  listElections,
} from '@/mocks/loader';

describe('loader smoke', () => {
  it('lists 1 active election', () => {
    expect(listElections()).toHaveLength(1);
  });
  it('returns sample district', () => {
    expect(getDistrict('district_sample_ga')?.region).toBe('샘플 시');
  });
  it('returns 4 candidates including needs_check', () => {
    const cs = listCandidates('district_sample_ga');
    expect(cs).toHaveLength(4);
    expect(cs.some((c) => c.reviewStatus === 'needs_check')).toBe(true);
  });
  it('deep clones — mutation does not affect seed', () => {
    const c = getCandidate('cand_001');
    if (c) c.name = 'MUTATED';
    const fresh = getCandidate('cand_001');
    expect(fresh?.name).toBe('가후보');
  });
  it('compare row assigns asset top quintile to richest reviewed candidate', () => {
    const rows = getCompareData('district_sample_ga');
    const top = rows.find((r) => r.assetInTopQuintile);
    expect(top?.candidate.id).toBe('cand_003');
  });
  it('district basis date = min of reviewed candidates sourceCheckedAt', () => {
    expect(getDistrictSourceCheckedAt('district_sample_ga')).toBe('2026-05-18');
  });
});
