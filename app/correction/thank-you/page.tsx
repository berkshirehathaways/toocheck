import Link from 'next/link';
import { SITE } from '@/lib/site/config';

export const metadata = {
  title: '정정 요청 접수 완료',
  description: '정정 요청을 보내주셔서 감사합니다. 검수 단서로 활용됩니다.',
};

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function ThankYouPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  return (
    <main className="mx-auto max-w-xl space-y-6 px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">thank you</p>
      <h1 className="text-2xl font-semibold tracking-tight">정정 요청이 접수되었습니다</h1>
      <p className="text-sm text-muted-foreground">
        보내주신 내용은 자료 검수 단서로 활용됩니다. 자동 회신은 보내지 않으며,
        반영 결과는 자료 갱신 시 공개됩니다.
      </p>
      {id ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm tabular-nums">
          접수 번호 · <span className="font-semibold">{id}</span>
        </p>
      ) : null}
      <div className="flex flex-col items-center gap-2 text-sm">
        <Link href="/districts" className="underline-offset-2 hover:underline">
          다른 지역·후보 살펴보기 →
        </Link>
        <Link href="/principles" className="underline-offset-2 hover:underline">
          서비스 원칙 다시 보기
        </Link>
        <a
          href={`mailto:${SITE.contactEmail}`}
          className="underline-offset-2 hover:underline"
        >
          운영자에게 추가 문의: {SITE.contactEmail}
        </a>
      </div>
    </main>
  );
}
