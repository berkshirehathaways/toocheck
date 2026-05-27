import { describe, expect, it } from 'vitest';
import { avgSpecificity, specificityLabel } from '@/lib/promise-specificity';

describe('promise-specificity', () => {
  it('labels 0,1 → 낮음', () => {
    expect(specificityLabel(0)).toBe('낮음');
    expect(specificityLabel(1)).toBe('낮음');
  });
  it('labels 2,3 → 보통', () => {
    expect(specificityLabel(2)).toBe('보통');
    expect(specificityLabel(3)).toBe('보통');
  });
  it('labels 4,5 → 높음', () => {
    expect(specificityLabel(4)).toBe('높음');
    expect(specificityLabel(5)).toBe('높음');
  });
  it('rounds avg to 1 decimal', () => {
    expect(avgSpecificity([2, 3, 4])).toBe(3);
    expect(avgSpecificity([1, 2, 2])).toBe(1.7);
    expect(avgSpecificity([])).toBe(0);
  });
});
