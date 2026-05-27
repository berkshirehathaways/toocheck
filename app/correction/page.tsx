import { Suspense } from 'react';
import { SITE } from '@/lib/site/config';
import { CorrectionForm } from './CorrectionForm';

export const metadata = {
  title: '정정 요청',
  description: '공개자료에 오류가 있을 경우 정정 요청을 보내주세요.',
};

export default function CorrectionPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">correction</p>
        <h1 className="text-2xl font-semibold tracking-tight">정정 요청</h1>
        <p className="text-sm text-muted-foreground">
          공개자료 기준으로 표시된 항목에 오류가 있다면 알려주세요. 운영자에게는{' '}
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="underline-offset-2 hover:underline"
          >
            {SITE.contactEmail}
          </a>
          로도 직접 연락하실 수 있습니다.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-muted-foreground">폼을 준비 중…</p>}>
        <CorrectionForm />
      </Suspense>
    </main>
  );
}
