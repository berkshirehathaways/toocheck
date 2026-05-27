import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'info' | 'check' | 'attention' | 'muted' | 'lime' | 'cyan';

const TONE_CLS: Record<Tone, string> = {
  neutral: 'border-hair bg-bg-elev text-ink/85',
  muted: 'border-hair-soft bg-bg-elev text-dim',
  info: 'border-[#2c4b73] bg-[#15243a] text-[#9bbbe2]',
  check: 'border-[#594321] bg-[#322411] text-[#e0b075]',
  attention: 'border-[#5b2424] bg-[#2a1414] text-[#e09b9b]',
  lime: 'border-lime/40 bg-lime/10 text-lime',
  cyan: 'border-cyan/40 bg-cyan/10 text-cyan',
};

export interface NeutralBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: React.ReactNode;
}

export function NeutralBadge({ tone = 'neutral', className, children, ...props }: NeutralBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-medium leading-none',
        TONE_CLS[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
