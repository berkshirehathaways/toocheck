import Link from 'next/link';
import { cn } from '@/lib/utils';

// '수정 요청'은 별도 행동이므로 단계가 아닌 CTA 셀로 분리
const PHASES = [
  { label: '공개 자료', helper: '후보별 디스클로저', href: '/districts' },
  { label: '비교', helper: '같은 지역 나란히', href: '/districts/district_sample_ga/compare' },
  { label: '함께 확인', helper: '교차 점검 메모', href: '/candidates/cand_003' },
] as const;

export function PhaseMap() {
  return (
    <div className="grid grid-cols-2 border-y border-hair text-ink/80 sm:grid-cols-4">
      {PHASES.map((p, i) => (
        <Link
          key={p.label}
          href={p.href}
          className={cn(
            'group relative flex flex-col gap-1 px-4 py-5 transition-colors hover:bg-cyan/5',
            i > 0 ? 'sm:border-l sm:border-hair' : '',
            i % 2 === 1 ? 'border-l border-hair' : ''
          )}
        >
          <span className="label-ko text-dim">{i + 1}단계</span>
          <span className="display-ko text-base font-bold text-ink/90 group-hover:text-cyan">
            {p.label}
          </span>
          <span className="label-ko text-lime">{p.helper}</span>
        </Link>
      ))}
      <Link
        href="/correction"
        className="group flex flex-col justify-center gap-1 border-l border-hair bg-cyan px-4 py-5 text-bg transition-colors hover:bg-cyan/90"
      >
        <span className="display-ko text-lg font-bold">
          수정 요청{' '}
          <span
            aria-hidden
            className="inline-block transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </span>
        <span className="label-ko text-bg/85">잘못된 자료를 알려주세요</span>
      </Link>
    </div>
  );
}
