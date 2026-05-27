'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatKrwShort } from '@/lib/format-krw';
import { specificityLabel } from '@/lib/promise-specificity';
import type { CompareRow } from '@/types/domain';

export interface CompareMobileProps {
  rows: CompareRow[];
}

export function CompareMobile({ rows }: CompareMobileProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);

  const scrollTo = (i: number) => {
    const c = containerRef.current;
    if (!c) return;
    const clamped = Math.max(0, Math.min(rows.length - 1, i));
    const card = c.children[clamped] as HTMLElement | undefined;
    if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    setIndex(clamped);
  };

  const onScroll = () => {
    const c = containerRef.current;
    if (!c) return;
    const w = c.clientWidth;
    if (!w) return;
    const i = Math.round(c.scrollLeft / w);
    setIndex(i);
  };

  React.useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    c.addEventListener('scroll', onScroll, { passive: true });
    return () => c.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2"
        role="region"
        aria-label="후보 비교 카드"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            scrollTo(index + 1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            scrollTo(index - 1);
          }
        }}
      >
        {rows.map((r, i) => {
          const pending = r.candidate.reviewStatus !== 'reviewed';
          return (
            <article
              key={r.candidate.id}
              className="w-[88%] shrink-0 snap-start rounded-lg border border-border bg-card p-4 text-sm"
              aria-roledescription="후보 비교 카드"
              aria-label={`${r.candidate.name} (${i + 1}/${rows.length})`}
            >
              <header className="mb-3 flex items-baseline justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="rounded bg-foreground/90 px-2 py-0.5 text-xs font-semibold text-background">
                    기호 {r.candidate.ballotNumber}
                  </span>
                  <h3 className="text-base font-semibold">{r.candidate.name}</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {i + 1} / {rows.length}
                </span>
              </header>
              <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-xs">
                <Row k="정당" v={r.candidate.party} />
                <Row k="재산총액" v={pending ? '—' : formatKrwShort(r.disclosure?.assetTotal ?? null)} />
                <Row k="재산 상위" v={pending ? '—' : r.assetInTopQuintile ? '상위 20%' : '—'} />
                <Row
                  k="전과 공개"
                  v={pending ? '—' : (r.disclosure?.criminalRecords.length ?? 0) > 0 ? '있음' : '없음'}
                />
                <Row
                  k="체납 공개"
                  v={pending ? '—' : (r.disclosure?.taxArrears.length ?? 0) > 0 ? '있음' : '없음'}
                />
                <Row k="병역" v={pending ? '—' : r.disclosure?.militarySummary ?? '공개자료'} />
                <Row k="공약 수" v={pending ? '—' : String(r.promiseCount)} />
                <Row
                  k="공약 구체성"
                  v={pending ? '—' : `${r.avgSpecificity.toFixed(1)} (${specificityLabel(Math.round(r.avgSpecificity))})`}
                />
                <Row k="확인 필요도" v={pending ? '자료 확인 중' : r.checkPriorityLabel} />
              </dl>
              <div className="mt-3">
                <Link
                  href={`/candidates/${r.candidate.id}`}
                  className="text-xs underline-offset-2 hover:underline"
                >
                  자세히 보기 →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => scrollTo(index - 1)}
          disabled={index <= 0}
          aria-label="이전 후보"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {index + 1} / {rows.length}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => scrollTo(index + 1)}
          disabled={index >= rows.length - 1}
          aria-label="다음 후보"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </>
  );
}
