import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatKrwShort } from '@/lib/format-krw';
import type { BadgeKind, Candidate, CandidatePromise, CompareRow } from '@/types/domain';

import { LimeStamp } from './LimeStamp';
import { NeutralBadge } from './NeutralBadge';
import { RegistrationMarks } from './RegistrationMarks';

const BADGE_LABEL: Record<BadgeKind, { label: string; tone: 'attention' | 'check' | 'info' | 'muted' | 'lime' }> = {
  criminal_record_present: { label: '전과 공개', tone: 'check' },
  tax_arrears_present: { label: '체납 공개', tone: 'check' },
  asset_top_quintile: { label: '재산 상위', tone: 'check' },
  military_disclosed: { label: '병역 공개', tone: 'info' },
  promise_specificity_high: { label: '구체성 높음', tone: 'lime' },
  data_pending: { label: '자료 확인 중', tone: 'muted' },
};

const BADGE_PRIORITY: BadgeKind[] = [
  'criminal_record_present',
  'tax_arrears_present',
  'asset_top_quintile',
  'promise_specificity_high',
  'military_disclosed',
  'data_pending',
];

export interface CandidateCardProps {
  candidate: Candidate;
  row: CompareRow;
  topPromises: CandidatePromise[];
  basisDate?: string;
  className?: string;
}

export function CandidateCard({ candidate, row, topPromises, basisDate, className }: CandidateCardProps) {
  const pending = candidate.reviewStatus !== 'reviewed';
  const sortedBadges = [...row.badges].sort(
    (a, b) => BADGE_PRIORITY.indexOf(a) - BADGE_PRIORITY.indexOf(b)
  );
  const shown = sortedBadges.slice(0, 3);
  const rest = sortedBadges.length - shown.length;

  return (
    <Link
      href={`/candidates/${candidate.id}`}
      className={cn(
        'group relative block hud-panel p-5 transition-colors hover:bg-cyan/[0.06] hover:border-cyan/50',
        className
      )}
    >
      <RegistrationMarks size={10} inset={6} color="cyan" />
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <span className="label-ko text-cyan">기호 {candidate.ballotNumber}</span>
        {basisDate ? (
          <span className="label-ko text-dim">기준일 · {basisDate}</span>
        ) : pending ? (
          <span className="label-ko text-dim">자료 확인 중</span>
        ) : null}
      </header>

      <div className="mb-3">
        <h3 className="font-ko text-2xl font-bold tracking-tight text-ink">{candidate.name}</h3>
        <p className="label-ko mt-1 text-dim">{candidate.party}</p>
      </div>

      {pending ? (
        <p className="label-ko text-ink/70">
          자료 입력 전입니다. 원문 확인 후 반영됩니다.
        </p>
      ) : (
        <>
          {row.disclosure ? (
            <p className="label-ko mb-3 text-dim">
              재산 <span className="text-ink/85 tabular-nums">{formatKrwShort(row.disclosure.assetTotal)}</span>
            </p>
          ) : null}
          <div className="mb-3 flex flex-wrap gap-1.5">
            {shown.map((b) => (
              <NeutralBadge key={b} tone={BADGE_LABEL[b].tone}>
                {BADGE_LABEL[b].label}
              </NeutralBadge>
            ))}
            {rest > 0 ? <NeutralBadge tone="muted">+{rest}건 더</NeutralBadge> : null}
          </div>
          {topPromises.length > 0 ? (
            <ul className="space-y-1.5 text-[13.5px] text-ink/85">
              {topPromises.map((p, i) => (
                <li key={p.id} className="flex gap-2">
                  <span className="label-ko shrink-0 text-cyan tabular-nums">{i + 1}.</span>
                  <span className="line-clamp-1">{p.title}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      <footer className="mt-4 flex items-center justify-between border-t border-hair-soft pt-3">
        <span className="label-ko text-dim">
          {pending ? '확인 필요도 — 자료 확인 중' : row.checkPriorityLabel}
        </span>
        <span className="label-ko text-cyan group-hover:underline">자세히 →</span>
      </footer>

      {pending ? (
        <span className="pointer-events-none absolute right-3 top-3">
          <LimeStamp rotate={-6}>자료 확인 중</LimeStamp>
        </span>
      ) : null}
    </Link>
  );
}
