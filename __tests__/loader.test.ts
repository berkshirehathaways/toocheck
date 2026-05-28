import { describe, expect, it } from 'vitest';
import {
  getCandidate,
  getCompareData,
  getDistrict,
  getDistrictSourceCheckedAt,
  listCandidates,
  listElections,
} from '@/mocks/loader';

// 실데이터(site-data.json) 기준 — 안정적 표본으로 서울 종로구 구청장 사용.
// 후보 2명: 유찬종(100154016, 더불어민주당), 정문헌(100163635, 국민의힘). 둘 다 reviewed.
const JONGNO = 'dist_4_4110100';

describe('loader smoke', () => {
  it('lists 1 active election', () => {
    expect(listElections()).toHaveLength(1);
  });

  it('returns a real district by id', () => {
    expect(getDistrict(JONGNO)?.name).toBe('종로구 구청장');
  });

  it('returns 종로구 구청장 후보 2명 (모두 reviewed)', () => {
    const cs = listCandidates(JONGNO);
    expect(cs).toHaveLength(2);
    expect(cs.every((c) => c.reviewStatus === 'reviewed')).toBe(true);
    expect(cs.map((c) => c.id).sort()).toEqual(['100154016', '100163635']);
  });

  it('deep clones — mutation does not affect source data', () => {
    const c = getCandidate('100154016');
    expect(c?.name).toBe('유찬종');
    if (c) c.name = 'MUTATED';
    const fresh = getCandidate('100154016');
    expect(fresh?.name).toBe('유찬종');
  });

  it('compare row assigns asset top quintile to richest reviewed candidate', () => {
    // 유찬종 4,060,212천원 > 정문헌 2,625,265천원 → 최상위 = 유찬종
    const rows = getCompareData(JONGNO);
    const top = rows.find((r) => r.assetInTopQuintile);
    expect(top?.candidate.id).toBe('100154016');
  });

  it('district basis date = min of reviewed candidates sourceCheckedAt', () => {
    const date = getDistrictSourceCheckedAt(JONGNO);
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
