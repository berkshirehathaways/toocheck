import Link from 'next/link';
import { cn } from '@/lib/utils';

const PHASES = [
  { en: 'DISCLOSURE', ko: '공개', href: '/districts' },
  { en: 'COMPARE', ko: '비교', href: '/districts/district_sample_ga/compare' },
  { en: 'CROSS.CHECK', ko: '점검', href: '/candidates/cand_003' },
  { en: 'CORRECTION', ko: '정정', href: '/correction' },
] as const;

export function PhaseMap() {
  return (
    <div className="grid grid-cols-2 border-y border-hair text-ink/80 sm:grid-cols-5">
      {PHASES.map((p, i) => (
        <Link
          key={p.en}
          href={p.href}
          className={cn(
            'group relative flex flex-col gap-1 px-4 py-5 transition-colors hover:bg-cyan/5',
            'border-hair',
            i > 0 ? 'border-l sm:border-l' : '',
            i % 2 === 1 ? 'border-l' : ''
          )}
        >
          <span className="mono mono-9 text-dim">PHASE {String.fromCharCode(65 + i)}</span>
          <span className="display-en text-base text-ink/90">{p.en}</span>
          <span className="mono mono-11 text-lime">{p.ko}</span>
        </Link>
      ))}
      <Link
        href="/correction"
        className="flex flex-col justify-center gap-1 border-l border-hair bg-cyan px-4 py-5 text-bg transition-colors hover:bg-cyan/90"
      >
        <span className="mono mono-9 text-bg/70">CTA</span>
        <span className="display-en text-base">정정 요청 →</span>
        <span className="mono mono-10 text-bg/80">correction</span>
      </Link>
    </div>
  );
}
