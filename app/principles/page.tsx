import Link from 'next/link';
import { HudLabel, RegistrationMarks } from '@/components/domain';
import { SITE } from '@/lib/site/config';

export const metadata = {
  title: '서비스 원칙',
  description: `${SITE.nameKo}의 5대 원칙.`,
};

const PRINCIPLES = [
  {
    id: 'public-source-first',
    title: '공개자료 우선',
    summary: '선관위·공보·공개 보고서 등 공식 자료만을 인용합니다.',
    body: '비공식 출처·익명 제보·추정 정보는 시드에 포함하지 않습니다. 자료가 없는 항목은 추정·합성하지 않고 "자료 입력 전입니다. 원문 확인 후 반영됩니다."로 표기합니다. 빈 칸을 채워 넣는 것이 잘못된 비교를 유발할 수 있기 때문입니다.',
  },
  {
    id: 'source-and-basis-date',
    title: '출처·자료 기준일 명시',
    summary: '모든 수치 옆에 자료 기준일과 원문 링크를 함께 표시합니다.',
    body: '자료 기준일은 지역 단위에서 가장 오래된 후보 자료의 갱신일을 기준으로 합니다. 잘못된 자료는 누구나 수정 요청 폼으로 신고할 수 있고, 접수된 요청은 검수 단서로 활용됩니다.',
  },
  {
    id: 'politically-neutral',
    title: '정치적 중립',
    summary: '후보를 지지·반대하지 않으며, 정당색을 의도적으로 사용하지 않습니다.',
    body: '비교표·카드의 색상은 그레이스케일을 기본으로 하며, 정보·확인 권장·주의 깊게 확인 세 신호색만 사용합니다. 후보 식별은 공유 카드 등에서 기호만으로 표시합니다.',
  },
];

export default function PrinciplesPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="space-y-3">
        <HudLabel tone="cyan">모든 화면·시드·수정 처리에 일관 적용</HudLabel>
        <h1 className="display-ko text-4xl font-bold text-ink">서비스 원칙</h1>
        <p className="text-[14.5px] text-ink/75">
          {SITE.nameKo}는 다음 {PRINCIPLES.length}가지 원칙 아래에서 운영됩니다.
        </p>
      </header>

      <ol className="space-y-3">
        {PRINCIPLES.map((p, i) => (
          <li key={p.id} className="relative hud-panel">
            <RegistrationMarks color="dim" size={10} inset={6} />
            <details className="group" open={i === 0}>
              <summary className="flex cursor-pointer items-start justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <div className="space-y-1">
                  <p className="label-ko text-cyan">제{i + 1}원칙</p>
                  <h2 className="font-ko text-xl font-bold text-ink">{p.title}</h2>
                  <p className="text-sm text-ink/70">{p.summary}</p>
                </div>
                <span aria-hidden className="label-ko text-dim transition-transform group-open:rotate-180">▾</span>
              </summary>
              <div className="border-t border-hair-soft px-5 py-4 text-[14.5px] leading-relaxed text-ink/85">
                {p.body}
              </div>
            </details>
          </li>
        ))}
      </ol>

      <aside className="hud-panel p-5">
        <HudLabel tone="lime">운영 연락처</HudLabel>
        <p className="mt-3 text-sm text-ink/85">
          수정 요청은{' '}
          <Link href="/correction" className="text-cyan underline-offset-2 hover:underline">
            수정 요청 폼
          </Link>
          으로, 운영자에게는{' '}
          <a href={`mailto:${SITE.contactEmail}`} className="text-cyan underline-offset-2 hover:underline">
            {SITE.contactEmail}
          </a>
          로 직접 연락하실 수 있습니다.
        </p>
      </aside>
    </main>
  );
}
