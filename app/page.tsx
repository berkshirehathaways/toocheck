import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SITE } from '@/lib/site/config';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {SITE.nameEn}
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        선거 전, 후보자 공개자료를 차분히 비교해 보세요.
      </h1>
      <p className="mt-4 text-base text-muted-foreground sm:text-lg">
        {SITE.nameKo}는 공개자료를 바탕으로 후보자를 비교해 보여주는 비당파
        도구입니다. 자극적인 표현 없이, 자료의 출처와 기준일을 함께 표시합니다.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/districts">내 지역 후보 확인하기</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={`/districts/${SITE.testDistrictId}`}>테스트 지역으로 보기</Link>
        </Button>
      </div>

      <section className="mt-12 grid gap-4 sm:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">공개자료 기준</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            모든 정보는 출처 링크와 자료 기준일을 함께 표시합니다.
          </p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">비당파 비교 도구</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            후보를 지지·반대하지 않습니다. 자료의 빈칸은 빈칸으로 둡니다.
          </p>
        </article>
      </section>

      <p className="mt-8 text-xs text-muted-foreground">
        오류가 있다면{' '}
        <Link href="/correction" className="underline-offset-2 hover:underline">
          정정 요청
        </Link>
        을 보내주세요. 운영자에게는{' '}
        <a
          href={`mailto:${SITE.contactEmail}`}
          className="underline-offset-2 hover:underline"
        >
          {SITE.contactEmail}
        </a>
        로 연락하실 수 있습니다.
      </p>
    </main>
  );
}
