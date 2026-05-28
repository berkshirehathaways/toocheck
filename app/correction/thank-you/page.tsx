import Link from 'next/link';
import { HudLabel, LimeStamp, RegistrationMarks } from '@/components/domain';
import { SITE } from '@/lib/site/config';

export const metadata = { title: '수정 요청 접수 완료' };

interface PageProps { searchParams: Promise<{ id?: string }>; }

export default async function ThankYouPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="relative hud-panel p-8 text-center">
        <RegistrationMarks color="cyan" inset={10} />
        <HudLabel tone="cyan" className="!flex !justify-center">접수 확인</HudLabel>
        {id ? (
          <div className="mt-5">
            <LimeStamp rotate={-3}>접수번호 · {id}</LimeStamp>
          </div>
        ) : null}
        <h1 className="display-ko mt-6 text-3xl font-bold text-ink">접수가 완료되었습니다</h1>
        <p className="mt-4 text-sm text-ink/75">
          보내주신 내용은 자료 검수 단서로 활용됩니다. 자동 회신은 보내지 않으며,
          반영 결과는 자료 갱신 시 공개됩니다.
        </p>

        <div className="label-ko mt-8 flex flex-col items-center gap-2 text-dim">
          <Link href="/districts" className="text-cyan hover:underline">다른 지역·후보 살펴보기 →</Link>
          <Link href="/principles" className="hover:text-cyan">서비스 원칙 다시 보기</Link>
          <a href={`mailto:${SITE.contactEmail}`} className="hover:text-cyan">
            운영자에게 추가 문의: {SITE.contactEmail}
          </a>
        </div>
      </div>
    </main>
  );
}
