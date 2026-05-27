'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { specificityLabel } from '@/lib/promise-specificity';
import type { CandidatePromise } from '@/types/domain';

import { NeutralBadge } from './NeutralBadge';
import { SourceLink } from './SourceLink';

export interface PromiseCardProps {
  promise: CandidatePromise;
  defaultExpanded?: boolean;
  className?: string;
}

const CATEGORY_LABEL: Record<CandidatePromise['category'], string> = {
  housing: '주거',
  tax: '조세',
  integrity: '청렴',
  transport: '교통',
  welfare: '복지',
  education: '교육',
  environment: '환경',
  safety: '안전',
  other: '기타',
};

export function PromiseCard({ promise, defaultExpanded = true, className }: PromiseCardProps) {
  // 결정 E9: 펼침 기본, 긴 본문은 '더보기'
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const isLong = promise.body.length > 140;
  const visibleBody = expanded || !isLong ? promise.body : promise.body.slice(0, 140) + '…';
  return (
    <article className={cn('rounded-lg border border-border bg-card p-4', className)}>
      <header className="mb-2 flex flex-wrap items-center gap-2">
        <NeutralBadge tone="muted">{CATEGORY_LABEL[promise.category]}</NeutralBadge>
        <NeutralBadge tone="neutral">구체성 {specificityLabel(promise.specificityScore)}</NeutralBadge>
        <h4 className="text-sm font-semibold">{promise.title}</h4>
      </header>
      <p className="text-sm leading-relaxed text-foreground/85">{visibleBody}</p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {expanded ? '접기' : '더보기'}
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
