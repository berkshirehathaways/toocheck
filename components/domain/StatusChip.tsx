import { cn } from '@/lib/utils';

interface StatusChipProps {
  children: React.ReactNode;
  tone?: 'live' | 'pending' | 'neutral';
  lang?: 'ko' | 'en';
  className?: string;
}

const LEAD: Record<NonNullable<StatusChipProps['tone']>, string> = {
  live: 'bg-lime shadow-[0_0_8px_rgba(190,242,100,0.6)]',
  pending: 'bg-white/30',
  neutral: 'bg-cyan',
};

/** 가운뎃점(·) 또는 / 로 구분된 작은 상태 칩. */
export function StatusChip({ children, tone = 'neutral', lang = 'ko', className }: StatusChipProps) {
  const text = lang === 'en' ? 'mono mono-10' : 'label-ko';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 border border-hair px-3 py-1.5 text-ink/85',
        text,
        className
      )}
    >
      <span aria-hidden className={cn('block h-1.5 w-1.5', LEAD[tone])} />
      <span className="flex flex-wrap items-center gap-1.5">{children}</span>
    </span>
  );
}

export function ChipDivider() {
  return <span aria-hidden className="text-ink/25">·</span>;
}
