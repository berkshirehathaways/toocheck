import { cn } from '@/lib/utils';
import type { Severity } from '@/types/domain';
import { RegistrationMarks } from './RegistrationMarks';
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
    <article className={cn('relative border p-4', c.bg, c.border, className)}>
      <RegistrationMarks size={10} inset={6} color="dim" />
      <header className="mb-2 flex items-center justify-between gap-2">
        <span className={cn('label-ko', c.fg)}>{SEVERITY_LABEL[severity]}</span>
      </header>
      <h3 className={cn('mb-2 font-ko text-lg font-bold leading-tight', c.fg)}>
        {title}
      </h3>
      <p className="text-[13.5px] leading-relaxed text-ink/80">{body}</p>
      {sourceUrl ? (
        <div className="mt-3">
          <SourceLink href={sourceUrl} basisDate={basisDate} />
        </div>
      ) : null}
    </article>
  );
}
