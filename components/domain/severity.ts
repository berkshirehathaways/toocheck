import type { Severity } from '@/types/domain';

// 결정 E2: 신호색 3종
export const SEVERITY_COLORS: Record<Severity, { bg: string; fg: string; border: string }> = {
  info: { bg: 'bg-[#eaf1f9]', fg: 'text-[#1f4068]', border: 'border-[#bcd0e5]' },
  check: { bg: 'bg-[#f6ebd9]', fg: 'text-[#6a4316]', border: 'border-[#e2c79a]' },
  high_attention: { bg: 'bg-[#f1dada]', fg: 'text-[#5a1f1f]', border: 'border-[#d6a8a8]' },
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  info: '정보',
  check: '확인 권장',
  high_attention: '주의 깊게 확인',
};
