'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { specificityLabel } from '@/lib/promise-specificity';
import type { CandidatePromise } from '@/types/domain';

import { NeutralBadge } from './NeutralBadge';
import { RegistrationMarks } from './RegistrationMarks';
import { SourceLink } from './SourceLink';

export interface PromiseCardProps {
  promise: CandidatePromise;
  index?: number;
  defaultExpanded?: boolean;
  className?: string;
}

const CATEGORY_LABEL: Record<CandidatePromise['category'], string> = {
  housing: '주거', tax: '조세', integrity: '청렴', transport: '교통',
  welfare: '복지', education: '교육', environment: '환경', safety: '안전', other: '기타',
};
const CATEGORY_EN: Record<CandidatePromise['category'], string> = {
  housing: 'HOUSING', tax: 'TAX', integrity: 'INTEGRITY', transport: 'TRANSPORT',
  welfare: 'WELFARE', education: 'EDUCATION', environment: 'ENVIRONMENT', safety: 'SAFETY', other: 'OTHER',
};

export function PromiseCard({ promise, index, defaultExpanded = true, className }: PromiseCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const isLong = promise.body.length > 140;
  const visibleBody = expanded || !isLong ? promise.body : promise.body.slice(0, 140) + '…';
  return (
    <article className={cn('relative hud-panel p-4', className)}>
      <RegistrationMarks size={10} inset={6} color="dim" />
      <header className="mb-2 flex flex-wrap items-center gap-2">
        {index != null ? (
          <span className="mono mono-10 text-cyan">[{String(index).padStart(2, '0')}]</span>
        ) : null}
        <NeutralBadge tone="muted">
          <span className="mono mono-10">{CATEGORY_EN[promise.category]}</span>
          <span className="ml-1 normal-case tracking-normal" style={{ letterSpacing: 0 }}>· {CATEGORY_LABEL[promise.category]}</span>
        </NeutralBadge>
        <NeutralBadge tone={promise.specificityScore >= 4 ? 'lime' : promise.specificityScore <= 1 ? 'attention' : 'neutral'}>
          구체성 {specificityLabel(promise.specificityScore)}
        </NeutralBadge>
      </header>
      <h4 className="mb-2 font-ko text-base font-bold leading-snug text-ink">{promise.title}</h4>
      <p className="text-[14px] leading-relaxed text-ink/80">{visibleBody}</p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mono mono-10 mt-2 text-cyan hover:underline"
        >
          {expanded ? '접기 ▲' : '더보기 ▼'}
        </button>
      ) : null}
      {promise.sourceUrl ? (
        <div className="mt-3">
          <SourceLink href={promise.sourceUrl}>공약 원문</SourceLink>
        </div>
      ) : null}
    </article>
  );
}
