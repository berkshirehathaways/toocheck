import { describe, expect, it } from 'vitest';
import { computeCheckPriority } from '@/lib/check-priority';
import type { CandidateCheckCard } from '@/types/domain';

const mk = (overrides: Partial<CandidateCheckCard>): CandidateCheckCard => ({
  id: 'x',
  candidateId: 'c',
  type: 'criminal_record',
  severity: 'info',
  title: 't',
  body: 'b',
  ...overrides,
});

describe('check-priority labels', () => {
  it('returns 기본 공개자료 확인 완료 for 0~30', () => {
    expect(computeCheckPriority([]).label).toBe('기본 공개자료 확인 완료');
  });
  it('returns 일부 있음 for 31~70', () => {
    const r = computeCheckPriority([mk({ type: 'criminal_record', severity: 'check' })]);
    expect(r.label).toBe('기본 공개자료 확인 완료'); // 30 → 라벨1
    const r2 = computeCheckPriority([
      mk({ type: 'criminal_record', severity: 'check' }),
      mk({ type: 'asset', severity: 'check' }),
    ]);
    expect(r2.label).toBe('확인할 항목이 일부 있음'); // 45
  });
  it('returns 많음 for >70', () => {
    const r = computeCheckPriority([
      mk({ type: 'criminal_record', severity: 'high_attention' }),
      mk({ type: 'tax_arrears', severity: 'check' }),
    ]);
    expect(r.label).toBe('확인할 항목이 많음'); // 50+25=75
  });
  it('caps score at 160', () => {
    const huge = Array.from({ length: 20 }, () =>
      mk({ type: 'criminal_record', severity: 'high_attention' })
    );
    expect(computeCheckPriority(huge).score).toBe(160);
  });
});
