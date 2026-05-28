import Link from 'next/link';
import { cn } from '@/lib/utils';

const PHASES = [
  { label: '공개 자료', helper: '후보별 디스클로저', href: '/districts' },
  { label: '비교', helper: '같은 지역 후보', href: '/districts/district_sample_ga/compare' },
  { label: '함께 확인', helper: '교차 점검 메모', href: '/candidates/cand_003' },
  { label: '정정 요청', helper: '오류 신고 폼', href: '/correction' },
] as const;

export function PhaseMap() {
  return (
    <div className="grid grid-cols-2 border-y border-hair text-ink/80 sm:grid-cols-5">
      {PHASES.map((p, i) => (
        <Link
          key={p.label}
          href={p.href}
          className={cn(
            'group relative flex flex-col gap-1 px-4 py-5 transition-colors hover:bg-cyan/5',
            'border-hair',
            i > 0 ? 'sm:border-l' : '',
            i % 2 === 1 ? 'border-l' : ''
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
        className="flex flex-col justify-center gap-1 border-l border-hair bg-cyan px-4 py-5 text-bg transition-colors hover:bg-cyan/90"
      >
        <span className="label-ko text-bg/70">바로가기</span>
        <span className="display-ko text-base font-bold">정정 요청 →</span>
        <span className="label-ko text-bg/80">잘못된 자료를 알려주세요</span>
      </Link>
    </div>
  );
}
