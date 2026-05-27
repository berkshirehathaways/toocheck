import { cn } from '@/lib/utils';

interface StatusChipProps {
  children: React.ReactNode;
  tone?: 'live' | 'pending' | 'neutral';
  className?: string;
}

const LEAD: Record<NonNullable<StatusChipProps['tone']>, string> = {
  live: 'bg-lime shadow-[0_0_8px_rgba(190,242,100,0.6)]',
  pending: 'bg-white/30',
  neutral: 'bg-cyan',
};

/** mono 10px hairline chip with leading colored square + slash-separated fragments. */
export function StatusChip({ children, tone = 'neutral', className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'mono mono-10 inline-flex items-center gap-2 border border-hair px-2.5 py-1 text-ink/85',
        className
      )}
    >
      <span aria-hidden className={cn('block h-1.5 w-1.5', LEAD[tone])} />
      <span className="flex flex-wrap items-center gap-1">{children}</span>
    </span>
  );
}

export function ChipDivider() {
  return <span aria-hidden className="text-ink/20">/</span>;
}
