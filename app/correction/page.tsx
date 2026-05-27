import { Suspense } from 'react';
import { HudLabel, RegistrationMarks } from '@/components/domain';
import { SITE } from '@/lib/site/config';
import { CorrectionForm } from './CorrectionForm';

export const metadata = {
  title: '정정 요청',
  description: '공개자료에 오류가 있을 경우 정정 요청을 보내주세요.',
};

export default function CorrectionPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8 space-y-3">
        <HudLabel tone="cyan">CORRECTION // INTAKE</HudLabel>
        <h1 className="display-ko text-4xl font-bold text-ink">정정 요청</h1>
        <p className="text-sm text-ink/75">
          공개자료 기준으로 표시된 항목에 오류가 있다면 알려주세요.
          운영자에게는{' '}
          <a href={`mailto:${SITE.contactEmail}`} className="text-cyan underline-offset-2 hover:underline">
            {SITE.contactEmail}
          </a>
          로도 직접 연락하실 수 있습니다.
        </p>
      </header>

      <div className="relative hud-panel p-6">
        <RegistrationMarks color="cyan" inset={8} />
        <Suspense fallback={<p className="mono mono-10 text-dim">FORM // LOADING…</p>}>
          <CorrectionForm />
        </Suspense>
      </div>
    </main>
  );
}
