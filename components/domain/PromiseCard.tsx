'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { parsePromiseBody, type PromiseBlock } from '@/lib/promise-format';
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

function BlockView({ block }: { block: PromiseBlock }) {
  return (
    <div className="space-y-1.5">
      {block.heading ? (
        <p className="label-ko flex items-center gap-1.5 font-semibold text-cyan/90">
          <span aria-hidden className="inline-block h-2 w-2 border border-cyan/70" />
          {block.heading}
        </p>
      ) : null}
      {block.lead ? (
        <p className="text-[13.5px] leading-relaxed text-ink/80">{block.lead}</p>
      ) : null}
      {block.bullets.length ? (
        <ul className={cn('space-y-1.5', block.heading && 'pl-3')}>
          {block.bullets.map((b, i) => (
            <li key={i} className="text-[13.5px] leading-relaxed">
              <span className="flex gap-1.5">
                <span aria-hidden className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full bg-cyan/70" />
                <span className="text-ink/85">{b.text}</span>
              </span>
              {b.subs.length ? (
                <ul className="mt-1 space-y-1 pl-4">
                  {b.subs.map((s, j) => (
                    <li key={j} className="flex gap-1.5 text-[13px] text-ink/65">
                      <span aria-hidden className="mt-[8px] inline-block h-[1.5px] w-2 shrink-0 bg-dim" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function PromiseCard({ promise, index, defaultExpanded = false, className }: PromiseCardProps) {
  const parsed = React.useMemo(() => parsePromiseBody(promise.body), [promise.body]);
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const isLong = parsed.structured
    ? parsed.blocks.length > 1 || (parsed.blocks[0]?.bullets.length ?? 0) > 2
    : promise.body.length > 140;

  const visibleBlocks =
    !isLong || expanded ? parsed.blocks : parsed.blocks.slice(0, 1);

  return (
    <article className={cn('relative hud-panel p-4', className)}>
      <RegistrationMarks size={10} inset={6} color="dim" />
      <header className="mb-2 flex flex-wrap items-center gap-2">
        {index != null ? (
          <span className="label-ko text-cyan tabular-nums">공약 {String(index).padStart(2, '0')}</span>
        ) : null}
        <NeutralBadge tone="muted">{CATEGORY_LABEL[promise.category]}</NeutralBadge>
      </header>
      <h4 className="mb-2.5 font-ko text-base font-bold leading-snug text-ink">{promise.title}</h4>

      {parsed.structured ? (
        <div className="space-y-3">
          {visibleBlocks.map((b, i) => <BlockView key={i} block={b} />)}
        </div>
      ) : (
        <p className="text-[14px] leading-relaxed text-ink/80">
          {expanded || !isLong ? parsed.blocks[0]?.lead ?? promise.body : (parsed.blocks[0]?.lead ?? promise.body).slice(0, 140) + '…'}
        </p>
      )}

      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="label-ko mt-3 text-cyan hover:underline"
        >
          {expanded ? '접기 ▲' : '전체 공약 보기 ▼'}
        </button>
      ) : null}
      {promise.sourceUrl ? (
        <div className="mt-3">
          <SourceLink href={promise.sourceUrl}>공약 원문</SourceLink>
        </div>
      ) : (
        <p className="label-ko mt-3 text-dim">
          출처 · 중앙선거관리위원회 정책공약마당 (5대공약)
        </p>
      )}
    </article>
  );
}
