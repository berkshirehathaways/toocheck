import { cn } from '@/lib/utils';

interface HudLabelProps {
  children: React.ReactNode;
  tone?: 'cyan' | 'lime' | 'dim';
  as?: 'span' | 'div' | 'h2' | 'h3';
  className?: string;
}

const SQ: Record<NonNullable<HudLabelProps['tone']>, string> = {
  cyan: 'bg-cyan',
  lime: 'bg-lime',
  dim: 'bg-white/30',
};

export function HudLabel({ children, tone = 'cyan', as: As = 'span', className }: HudLabelProps) {
  return (
    <As
      className={cn(
        'mono mono-10 inline-flex items-center gap-2 text-ink/85',
        className
      )}
    >
      <span aria-hidden className={cn('block h-1.5 w-1.5', SQ[tone])} />
      <span>{children}</span>
    </As>
  );
}
