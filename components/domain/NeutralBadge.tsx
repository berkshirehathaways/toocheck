import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'info' | 'check' | 'attention' | 'muted';

const TONE_CLS: Record<Tone, string> = {
  neutral: 'bg-secondary text-secondary-foreground border-border',
  info: 'bg-[#eaf1f9] text-[#1f4068] border-[#bcd0e5]',
  check: 'bg-[#f6ebd9] text-[#6a4316] border-[#e2c79a]',
  attention: 'bg-[#f1dada] text-[#5a1f1f] border-[#d6a8a8]',
  muted: 'bg-muted text-muted-foreground border-border',
};

export interface NeutralBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  children: React.ReactNode;
}

export function NeutralBadge({ tone = 'neutral', className, children, ...props }: NeutralBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
        TONE_CLS[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
