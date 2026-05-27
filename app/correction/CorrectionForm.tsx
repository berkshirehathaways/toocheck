'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

const REQUESTER_OPTIONS = [
  { value: 'candidate_or_camp', label: '후보자 / 캠프' },
  { value: 'general', label: '일반 시민' },
  { value: 'press', label: '언론' },
  { value: 'other', label: '기타' },
] as const;

// 결정 G6: 동의 문구 (4요소: 목적·항목·기간 30일·파기)
const CONSENT_TEXT =
  '정정 요청 처리 목적으로 입력하신 내용과 (선택 입력 시) 이메일을 보관·이용합니다. 보관 기간은 처리 완료 후 30일 이내이며, 그 이후 자동 파기됩니다.';

interface SubmitState {
  status: 'idle' | 'submitting' | 'error';
  error?: string;
}

export function CorrectionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const prefilledCandidateId = params?.get('candidateId') ?? '';
  const [state, setState] = React.useState<SubmitState>({ status: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ status: 'submitting' });
    const body = {
      requesterType: fd.get('requesterType'),
      targetCandidateId: fd.get('targetCandidateId') || undefined,
      targetField: fd.get('targetField') || undefined,
      factualClaim: fd.get('factualClaim'),
      evidenceUrl: fd.get('evidenceUrl') || undefined,
      email: fd.get('email') || undefined,
      consent: fd.get('consent') === 'on',
    };
    try {
      const res = await fetch('/api/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        const message = json?.error?.message ?? '제출에 실패했습니다.';
        setState({ status: 'error', error: message });
        return;
      }
      router.push(`/correction/thank-you?id=${encodeURIComponent(json.id)}`);
    } catch (err) {
      setState({ status: 'error', error: '네트워크 오류가 발생했습니다.' });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="요청자 유형" htmlFor="requesterType" required>
        <div className="flex flex-wrap gap-3">
          {REQUESTER_OPTIONS.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="requesterType"
                value={o.value}
                defaultChecked={o.value === 'general'}
                required
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="대상 후보 ID (선택)" htmlFor="targetCandidateId">
        <input
          id="targetCandidateId"
          name="targetCandidateId"
          type="text"
          defaultValue={prefilledCandidateId}
          placeholder="예: cand_002"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="대상 항목 (선택)" htmlFor="targetField">
        <input
          id="targetField"
          name="targetField"
          type="text"
          placeholder="예: 재산총액, 전과 기록, 공약 본문"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="사실관계" htmlFor="factualClaim" required>
        <textarea
          id="factualClaim"
          name="factualClaim"
          required
          minLength={5}
          rows={5}
          placeholder="정정이 필요한 항목과 사실관계를 차분히 적어주세요. 추정·평가·인격적 표현은 검수에서 제외될 수 있습니다."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <Field label="근거 링크 (권장)" htmlFor="evidenceUrl">
        <input
          id="evidenceUrl"
          name="evidenceUrl"
          type="url"
          placeholder="https://..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          현재 첨부는 지원하지 않습니다. 근거 링크를 활용해주세요.
        </p>
      </Field>

      <Field label="회신용 이메일 (선택)" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          placeholder="me@example.com"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
      </Field>

      <fieldset className="rounded-md border border-border bg-muted/30 p-4 text-sm">
        <label className="flex items-start gap-2">
          <input type="checkbox" name="consent" required className="mt-1" />
          <span>{CONSENT_TEXT}</span>
        </label>
      </fieldset>

      {state.status === 'error' ? (
        <p className="rounded-md border border-[#d6a8a8] bg-[#f1dada] px-3 py-2 text-sm text-[#5a1f1f]">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          접수 후 자동 응답은 보내지 않습니다. 처리 결과는 자료 갱신으로 반영됩니다.
        </p>
        <Button type="submit" disabled={state.status === 'submitting'}>
          {state.status === 'submitting' ? '제출 중…' : '정정 요청 보내기'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
        {required ? <span className="ml-1 text-[#7c2b2b]">*</span> : null}
      </label>
      {children}
    </div>
  );
}
