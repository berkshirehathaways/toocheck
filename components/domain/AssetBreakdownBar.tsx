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
  // 구체 분해 데이터(부동산·예금·증권)가 하나라도 없으면 그래프 자체를 비표시.
  // (NEC 요약 페이지엔 총액만, 분해 %는 등록서류 스캔 OCR 후에만 채워짐 — #13 §8-3)
  const hasBreakdown =
    (breakdown.realEstate ?? 0) > 0 ||
    (breakdown.deposit ?? 0) > 0 ||
    (breakdown.securities ?? 0) > 0;

  if (!hasBreakdown) {
    return (
      <p className={cn('label-ko text-dim', className)}>
        구성 비율은 등록서류 검수 후 표시됩니다.
      </p>
    );
  }

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
