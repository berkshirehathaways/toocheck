import { cn } from '@/lib/utils';
import type { Severity } from '@/types/domain';
import { SEVERITY_COLORS, SEVERITY_LABEL } from './severity';
import { SourceLink } from './SourceLink';

export interface CheckCardProps {
  severity: Severity;
  title: string;
  body: string;
  sourceUrl?: string;
  basisDate?: string;
  className?: string;
}

export function CheckCard({ severity, title, body, sourceUrl, basisDate, className }: CheckCardProps) {
  const c = SEVERITY_COLORS[severity];
  return (
    <article className={cn('rounded-lg border p-4', c.bg, c.border, className)}>
      <header className="mb-1 flex items-center justify-between gap-2">
        <h3 className={cn('text-sm font-semibold', c.fg)}>{title}</h3>
        <span className={cn('text-[11px] font-medium uppercase tracking-wide', c.fg)}>
          {SEVERITY_LABEL[severity]}
        </span>
      </header>
      <p className="text-sm leading-relaxed text-foreground/80">{body}</p>
      {sourceUrl ? (
        <div className="mt-3">
          <SourceLink href={sourceUrl} basisDate={basisDate} />
        </div>
      ) : null}
    </article>
  );
}
