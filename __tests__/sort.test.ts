import { describe, expect, it } from 'vitest';
import { sortCompareRows } from '@/lib/api/sort';
import type { CompareRow, Candidate, CandidateDisclosure } from '@/types/domain';

// 실데이터에는 needs_check 후보가 없으므로(전수 reviewed), 정렬 컴퍼레이터의
// "needs_check 항상 마지막" 규칙은 합성 CompareRow로 단위 검증한다.

function mkRow(
  id: string,
  ballotNumber: number,
  reviewStatus: Candidate['reviewStatus'],
  assetTotal: number | null
): CompareRow {
  const candidate = {
    id,
    name: id,
    ballotNumber,
    reviewStatus,
  } as unknown as Candidate;
  const disclosure =
    assetTotal === null ? null : ({ assetTotal, criminalRecords: [], taxArrears: [] } as unknown as CandidateDisclosure);
  return {
    candidate,
    disclosure,
    promiseCount: 0,
    avgSpecificity: 0,
    assetRankInDistrict: null,
    assetInTopQuintile: false,
    badges: [],
    checkPriorityScore: 0,
    checkPriorityLabel: '',
  };
}

const rows = (): CompareRow[] => [
  mkRow('reviewed_b2', 2, 'reviewed', 500_000_000),
  mkRow('pending', 3, 'needs_check', null),
  mkRow('reviewed_b1', 1, 'reviewed', 2_000_000_000),
];

describe('sort: needs_check 후보는 항상 마지막', () => {
  it('ballot 정렬 시 needs_check는 마지막', () => {
    const sorted = sortCompareRows(rows(), 'ballot');
    expect(sorted[sorted.length - 1]?.candidate.reviewStatus).toBe('needs_check');
    // reviewed는 기호 오름차순
    const reviewed = sorted.filter((r) => r.candidate.reviewStatus === 'reviewed');
    expect(reviewed.map((r) => r.candidate.ballotNumber)).toEqual([1, 2]);
  });

  it('asset_desc 정렬 시 needs_check는 마지막 + reviewed 자산 내림차순', () => {
    const sorted = sortCompareRows(rows(), 'asset_desc');
    expect(sorted[sorted.length - 1]?.candidate.reviewStatus).toBe('needs_check');
    const reviewed = sorted.filter((r) => r.candidate.reviewStatus === 'reviewed');
    for (let i = 1; i < reviewed.length; i++) {
      const prev = reviewed[i - 1]?.disclosure?.assetTotal ?? 0;
      const curr = reviewed[i]?.disclosure?.assetTotal ?? 0;
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});
