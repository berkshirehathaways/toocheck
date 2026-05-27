import { cn } from '@/lib/utils';
import { formatKrwShort } from '@/lib/format-krw';
import { formatSourceBasis } from '@/lib/format-date';
import type { CandidateDisclosure } from '@/types/domain';

import { AssetBreakdownBar } from './AssetBreakdownBar';
import { NeutralBadge } from './NeutralBadge';
import { SourceLink } from './SourceLink';

export interface DisclosureCardProps {
  disclosure: CandidateDisclosure;
  className?: string;
}

export function DisclosureCard({ disclosure, className }: DisclosureCardProps) {
  const basis = formatSourceBasis(disclosure.sourceCheckedAt);
  const sourceUrl = disclosure.sourceUrls[0];
  return (
    <section className={cn('rounded-lg border border-border bg-card p-5', className)}>
      <header className="mb-4 flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold">공개 자료</h3>
        <span className="text-xs text-muted-foreground">{basis}</span>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">재산신고액</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatKrwShort(disclosure.assetTotal)}
          </p>
          <div className="mt-3">
            <AssetBreakdownBar breakdown={disclosure.assetBreakdown} />
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">전과 기록</p>
            {disclosure.criminalRecords.length === 0 ? (
              <p>공개 자료 없음</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {disclosure.criminalRecords.map((r, i) => (
                  <li key={i}>
                    {r.year}년 · {r.law} · {r.outcome}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">체납 기록</p>
            {disclosure.taxArrears.length === 0 ? (
              <p>공개 자료 없음</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {disclosure.taxArrears.map((r, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <span>
                      {r.year}년 · {formatKrwShort(r.amountKrw)}
                    </span>
                    <NeutralBadge tone={r.status === 'paid' ? 'info' : 'attention'}>
                      {r.status === 'paid' ? '완납' : '미납'}
                    </NeutralBadge>
                    {r.note ? <span className="text-muted-foreground">· {r.note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">병역</p>
            <p className="leading-relaxed">{disclosure.militaryRecord}</p>
            {disclosure.militarySummary ? (
              <p className="text-xs text-muted-foreground">
                요약: {disclosure.militarySummary} · 공개자료 기준
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {sourceUrl ? (
        <div className="mt-4 border-t border-border pt-3">
          <SourceLink href={sourceUrl} basisDate={basis} />
        </div>
      ) : null}
    </section>
  );
}
