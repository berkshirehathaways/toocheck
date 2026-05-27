import Link from 'next/link';
import { SITE } from '@/lib/site/config';

export const metadata = {
  title: '서비스 원칙',
  description: `${SITE.nameKo}의 5대 원칙: 공개자료 우선, 출처·기준일 명시, 비당파, 자료 빈칸 보존, 정정 가능.`,
};

interface PrincipleItem {
  id: string;
  title: string;
  summary: string;
  body: string;
}

const PRINCIPLES: PrincipleItem[] = [
  {
    id: 'public-source-first',
    title: '공개자료 우선',
    summary: '선관위·공보·공개 보고서 등 공식 자료만을 인용합니다.',
    body: '비공식 출처, 익명 제보, 추정 정보는 시드에 포함하지 않습니다. 모든 항목은 출처 URL과 함께 노출됩니다.',
  },
  {
    id: 'source-and-basis-date',
    title: '출처·자료 기준일 명시',
    summary: '모든 수치 옆에 자료 기준일(YYYY년 M월 D일 기준)을 함께 표시합니다.',
    body: '자료 기준일은 District 단위에서 가장 오래된 후보 자료의 갱신일을 기준으로 합니다. 자료가 오래된 항목은 자체적으로 강조됩니다.',
  },
  {
    id: 'non-partisan',
    title: '비당파',
    summary: '후보를 지지·반대하지 않으며, 정당색을 의도적으로 사용하지 않습니다.',
    body: '비교표·카드의 색상은 그레이스케일을 기본으로 하며, 정보(info)·확인 권장(check)·주의 깊게 확인(attention) 세 신호색만 사용합니다.',
  },
  {
    id: 'preserve-blanks',
    title: '자료 빈칸 보존',
    summary: '자료가 없는 항목은 추정·합성하지 않고 “자료 입력 전입니다.”로 표시합니다.',
    body: '빈 칸을 채워 넣는 것이 잘못된 비교를 유발할 수 있다고 보기 때문입니다. 자료 확인 중 후보는 별도 배지로 안내합니다.',
  },
  {
    id: 'correctable',
    title: '정정 가능',
    summary: '잘못된 자료는 정정 요청 폼으로 누구나 보고할 수 있습니다.',
    body: '접수 시 반드시 회신할 수는 없지만, 모든 정정 요청은 검수 단서로 활용됩니다. 운영자에게 이메일(contact@alphaview.kr)로도 연락하실 수 있습니다.',
  },
];

export default function PrinciplesPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          principles
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">서비스 원칙</h1>
        <p className="text-sm text-muted-foreground">
          {SITE.nameKo}는 다음 5가지 원칙 아래에서 운영됩니다. 본 원칙은 모든 화면·시드·정정 처리에 일관 적용됩니다.
        </p>
      </header>

      <ol className="space-y-4">
        {PRINCIPLES.map((p, i) => (
          <li key={p.id} className="rounded-lg border border-border bg-card">
            <details className="group" open={i === 0}>
              <summary className="flex cursor-pointer items-baseline justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-xs text-muted-foreground">원칙 {i + 1}</p>
                  <h2 className="text-base font-semibold">{p.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>
                </div>
                <span className="text-xs text-muted-foreground transition group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="border-t border-border px-5 py-4 text-sm leading-relaxed text-foreground/85">
                {p.body}
              </div>
            </details>
          </li>
        ))}
      </ol>

      <aside className="rounded-lg border border-border bg-muted/40 p-5 text-sm">
        <p>
          정정 요청은{' '}
          <Link href="/correction" className="underline-offset-2 hover:underline">
            /correction
          </Link>{' '}
          폼으로 보내실 수 있고, 운영자에게는{' '}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="underline-offset-2 hover:underline"
          >
            {SITE.contactEmail}
          </a>
          로 직접 연락하실 수 있습니다.
        </p>
      </aside>
    </main>
  );
}
