import { cn } from '@/lib/utils';
import { formatKrwShort } from '@/lib/format-krw';
import { formatSourceBasis } from '@/lib/format-date';
import type { CandidateDisclosure } from '@/types/domain';

import { AssetBreakdownBar } from './AssetBreakdownBar';
import { HudLabel } from './HudLabel';
import { NeutralBadge } from './NeutralBadge';
import { RegistrationMarks } from './RegistrationMarks';
import { SourceLink } from './SourceLink';

export interface DisclosureCardProps {
  disclosure: CandidateDisclosure;
  className?: string;
}

export function DisclosureCard({ disclosure, className }: DisclosureCardProps) {
  const basis = formatSourceBasis(disclosure.sourceCheckedAt);
  const sourceUrl = disclosure.sourceUrls[0];
  return (
    <section className={cn('hud-panel relative p-6', className)}>
      <RegistrationMarks color="cyan" inset={8} />
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <HudLabel tone="cyan">DISCLOSURE // 04</HudLabel>
        <span className="mono mono-10 text-dim">BASIS / {basis}</span>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="mono mono-10 text-dim">// 재산총액</p>
          <p className="mt-1 font-ko text-3xl font-bold tabular-nums text-ink">
            {formatKrwShort(disclosure.assetTotal)}
          </p>
          <div className="mt-4">
            <AssetBreakdownBar breakdown={disclosure.assetBreakdown} />
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="mono mono-10 text-dim">// 전과 [{String(disclosure.criminalRecords.length).padStart(2, '0')}]</p>
            {disclosure.criminalRecords.length === 0 ? (
              <p className="text-ink/70">공개 자료 없음</p>
            ) : (
              <ul className="mt-1 space-y-1 text-ink/85">
                {disclosure.criminalRecords.map((r, i) => (
                  <li key={i}>{r.year}년 · {r.law} · {r.outcome}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mono mono-10 text-dim">// 체납 [{String(disclosure.taxArrears.length).padStart(2, '0')}]</p>
            {disclosure.taxArrears.length === 0 ? (
              <p className="text-ink/70">공개 자료 없음</p>
            ) : (
              <ul className="mt-1 space-y-1.5 text-ink/85">
                {disclosure.taxArrears.map((r, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums">{r.year}년 · {formatKrwShort(r.amountKrw)}</span>
                    <NeutralBadge tone={r.status === 'paid' ? 'info' : 'attention'}>
                      {r.status === 'paid' ? '완납' : '미납'}
                    </NeutralBadge>
                    {r.note ? <span className="text-dim">· {r.note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mono mono-10 text-dim">// 병역</p>
            <p className="leading-relaxed text-ink/85">{disclosure.militaryRecord}</p>
            {disclosure.militarySummary ? (
              <p className="mono mono-10 mt-1 text-dim">
                요약: <span className="normal-case tracking-normal" style={{ letterSpacing: 0 }}>{disclosure.militarySummary}</span> · 공개자료 기준
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {sourceUrl ? (
        <div className="mt-5 border-t border-hair pt-4">
          <SourceLink href={sourceUrl} basisDate={basis} />
        </div>
      ) : null}
    </section>
  );
}
