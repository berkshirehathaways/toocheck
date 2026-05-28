import type { Severity } from '@/types/domain';

export const SEVERITY_COLORS: Record<Severity, { bg: string; fg: string; border: string }> = {
  info: { bg: 'bg-[#15243a]', fg: 'text-[#9bbbe2]', border: 'border-[#2c4b73]' },
  check: { bg: 'bg-[#322411]', fg: 'text-[#e0b075]', border: 'border-[#594321]' },
  high_attention: { bg: 'bg-[#2a1414]', fg: 'text-[#e09b9b]', border: 'border-[#5b2424]' },
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  info: '정보',
  check: '확인 권장',
  high_attention: '주의 깊게 확인',
};
