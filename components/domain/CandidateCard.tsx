import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatKrwShort } from '@/lib/format-krw';
import type { BadgeKind, Candidate, CandidatePromise, CompareRow } from '@/types/domain';

import { NeutralBadge } from './NeutralBadge';

const BADGE_LABEL: Record<BadgeKind, { label: string; tone: 'attention' | 'check' | 'info' | 'muted' }> = {
  criminal_record_present: { label: '전과 공개 자료 있음', tone: 'check' },
  tax_arrears_present: { label: '체납 공개 자료 있음', tone: 'check' },
  asset_top_quintile: { label: '재산 상위', tone: 'check' },
  military_disclosed: { label: '병역 공개', tone: 'info' },
  promise_specificity_high: { label: '공약 구체성 높음', tone: 'info' },
  data_pending: { label: '자료 확인 중', tone: 'muted' },
};

// 결정 D9 우선순위
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
  topPromises: CandidatePromise[]; // 결정 D10: 상위 2개
  className?: string;
}

export function CandidateCard({ candidate, row, topPromises, className }: CandidateCardProps) {
  const sortedBadges = [...row.badges].sort(
    (a, b) => BADGE_PRIORITY.indexOf(a) - BADGE_PRIORITY.indexOf(b)
  );
  const shown = sortedBadges.slice(0, 3);
  const rest = sortedBadges.length - shown.length;
  return (
    <Link
      href={`/candidates/${candidate.id}`}
      className={cn(
        'block rounded-lg border border-border bg-card p-4 transition hover:border-foreground/30 hover:shadow-sm',
        className
      )}
    >
      <header className="mb-2 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="rounded bg-foreground/90 px-2 py-0.5 text-xs font-semibold text-background">
            기호 {candidate.ballotNumber}
          </span>
          <h3 className="text-base font-semibold">{candidate.name}</h3>
          <span className="text-xs text-muted-foreground">· {candidate.party}</span>
        </div>
        {row.disclosure ? (
          <span className="text-xs tabular-nums text-muted-foreground">
            재산 {formatKrwShort(row.disclosure.assetTotal)}
          </span>
        ) : null}
      </header>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {shown.map((b) => (
          <NeutralBadge key={b} tone={BADGE_LABEL[b].tone}>
            {BADGE_LABEL[b].label}
          </NeutralBadge>
        ))}
        {rest > 0 ? <NeutralBadge tone="muted">+{rest}개 더보기</NeutralBadge> : null}
      </div>

      {topPromises.length > 0 ? (
        <ul className="space-y-1 text-sm text-foreground/85">
          {topPromises.map((p) => (
            <li key={p.id} className="line-clamp-1">
              · {p.title}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">자료 입력 전입니다. 원문 확인 후 반영됩니다.</p>
      )}

      <p className="mt-3 text-xs text-muted-foreground">{row.checkPriorityLabel}</p>
    </Link>
  );
}
