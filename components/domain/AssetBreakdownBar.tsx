import { cn } from '@/lib/utils';

export interface AssetBreakdownBarProps {
  breakdown: { realEstate: number; deposit: number; securities: number; other: number };
  className?: string;
}

const SEGMENTS: Array<{
  key: keyof AssetBreakdownBarProps['breakdown'];
  label: string;
  cls: string;
}> = [
  { key: 'realEstate', label: '부동산', cls: 'bg-ink/85' },
  { key: 'deposit', label: '예금', cls: 'bg-cyan/70' },
  { key: 'securities', label: '증권', cls: 'bg-lime/70' },
  { key: 'other', label: '기타', cls: 'bg-ink/25' },
];

export function AssetBreakdownBar({ breakdown, className }: AssetBreakdownBarProps) {
  const total = SEGMENTS.reduce((a, s) => a + (breakdown[s.key] ?? 0), 0) || 1;
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex h-2 w-full overflow-hidden border border-hair bg-bg">
        {SEGMENTS.map((s) => {
          const v = breakdown[s.key] ?? 0;
          if (v === 0) return null;
          return (
            <div
              key={s.key}
              className={s.cls}
              style={{ width: `${(v / total) * 100}%` }}
              role="presentation"
            />
          );
        })}
      </div>
      <ul className="label-ko flex flex-wrap gap-x-3 gap-y-1 text-dim">
        {SEGMENTS.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-1.5">
            <span className={cn('block h-1.5 w-1.5', s.cls)} aria-hidden />
            <span>
              {s.label} <span className="tabular-nums text-ink/85">{breakdown[s.key] ?? 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
