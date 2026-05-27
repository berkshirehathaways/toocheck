import { describe, expect, it } from 'vitest';
import { formatKrwShort, formatKrwFull } from '@/lib/format-krw';

describe('format-krw', () => {
  it('shows 1자리 소수점 over 1억', () => {
    expect(formatKrwShort(1_234_000_000)).toBe('12.3억');
  });
  it('handles negative', () => {
    expect(formatKrwShort(-100_000_000)).toBe('-1억');
  });
  it('falls back to 만원', () => {
    expect(formatKrwShort(50_000_000)).toBe('5,000만원');
  });
  it('handles null', () => {
    expect(formatKrwShort(null)).toBe('—');
  });
  it('full uses Korean locale', () => {
    expect(formatKrwFull(1_234_567)).toBe('1,234,567원');
  });
});
