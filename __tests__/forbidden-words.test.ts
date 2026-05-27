import { describe, expect, it } from 'vitest';
import { findForbiddenWords, assertNoForbiddenWords } from '@/lib/forbidden-words';

describe('forbidden-words', () => {
  it('catches single forbidden token (부분 일치)', () => {
    const hits = findForbiddenWords('이 후보는 비리에 연루되어 있다.');
    expect(hits.map((h) => h.word)).toContain('비리');
  });

  it('returns empty array when clean', () => {
    expect(findForbiddenWords('재산신고액은 3억 2,000만 원입니다.')).toEqual([]);
  });

  it('matches partial word (부분 일치)', () => {
    const hits = findForbiddenWords('극우 성향 단체에 후원했다.');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('asserts throws (non-prod) when hits found', () => {
    // NODE_ENV !== 'production' (vitest 기본은 'test') → throw 경로 검증
    expect(() => assertNoForbiddenWords('이 후보의 위선', 'test')).toThrow();
  });

  it('asserts no throw when text is clean', () => {
    expect(() => assertNoForbiddenWords('재산신고액 3억 원', 'test')).not.toThrow();
  });
});
