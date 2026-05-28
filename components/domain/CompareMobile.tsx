'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatKrwShort } from '@/lib/format-krw';
import type { CompareRow } from '@/types/domain';
import { RegistrationMarks } from './RegistrationMarks';

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

  React.useEffect(() => {
    const c = containerRef.current;
    if (!c) return;
    const onScroll = () => {
      const w = c.clientWidth;
      if (!w) return;
      setIndex(Math.round(c.scrollLeft / w));
    };
    c.addEventListener('scroll', onScroll, { passive: true });
    return () => c.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2"
        role="region"
        aria-label="후보 비교 카드"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') { e.preventDefault(); scrollTo(index + 1); }
          else if (e.key === 'ArrowLeft') { e.preventDefault(); scrollTo(index - 1); }
        }}
      >
        {rows.map((r, i) => {
          const pending = r.candidate.reviewStatus !== 'reviewed';
          return (
            <article
              key={r.candidate.id}
              className="relative w-[88%] shrink-0 snap-start hud-panel p-4 text-sm"
              aria-roledescription="후보 비교 카드"
              aria-label={`${r.candidate.name} (${i + 1}/${rows.length})`}
            >
              <RegistrationMarks size={10} inset={6} color="cyan" />
              <header className="mb-3 flex items-baseline justify-between">
                <span className="label-ko text-cyan">기호 {r.candidate.ballotNumber}</span>
                <span className="label-ko text-dim tabular-nums">
                  {String(i + 1).padStart(2, '0')} / {String(rows.length).padStart(2, '0')}
                </span>
              </header>
              <h3 className="font-ko text-xl font-bold text-ink">{r.candidate.name}</h3>
              <p className="label-ko mb-3 text-dim">· {r.candidate.party}</p>
              <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 text-[13px]">
                <Row k="재산총액" v={pending ? '—' : formatKrwShort(r.disclosure?.assetTotal ?? null)} />
                <Row k="재산 상위" v={pending ? '—' : r.assetInTopQuintile ? '상위 20%' : '—'} />
                <Row k="전과 공개" v={pending ? '—' : (r.disclosure?.criminalRecords.length ?? 0) > 0 ? '있음' : '없음'} />
                <Row k="체납 공개" v={pending ? '—' : (r.disclosure?.taxArrears.length ?? 0) > 0 ? '있음' : '없음'} />
                <Row k="병역" v={pending ? '—' : (r.disclosure?.militarySummary ?? r.disclosure?.militaryRecord ?? '공개자료')} />
                <Row k="공약 수" v={pending ? '—' : String(r.promiseCount)} />
              </dl>
              <div className="mt-3 border-t border-hair-soft pt-3">
                <Link href={`/candidates/${r.candidate.id}`} className="label-ko text-cyan hover:underline">
                  자세히 보기 →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => scrollTo(index - 1)}
          disabled={index <= 0}
          className="label-ko inline-flex items-center gap-1 border border-hair px-3 py-1.5 text-ink/80 transition-colors hover:bg-cyan/10 disabled:opacity-30"
          aria-label="이전 후보"
        >
          <ChevronLeft className="h-3 w-3" /> 이전
        </button>
        <span className="label-ko tabular-nums text-dim">
          {String(index + 1).padStart(2, '0')} / {String(rows.length).padStart(2, '0')}
        </span>
        <button
          onClick={() => scrollTo(index + 1)}
          disabled={index >= rows.length - 1}
          className="label-ko inline-flex items-center gap-1 border border-hair px-3 py-1.5 text-ink/80 transition-colors hover:bg-cyan/10 disabled:opacity-30"
          aria-label="다음 후보"
        >
          다음 <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="label-ko text-dim">{k}</dt>
      <dd className="tabular-nums text-ink/85">{v}</dd>
    </>
  );
}
