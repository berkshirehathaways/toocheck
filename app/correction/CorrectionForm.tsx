'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const REQUESTER_OPTIONS = [
  { value: 'candidate_or_camp', label: '후보자 / 캠프' },
  { value: 'general', label: '일반 시민' },
  { value: 'press', label: '언론' },
  { value: 'other', label: '기타' },
] as const;

const CONSENT_TEXT =
  '수정 요청 처리 목적으로 입력하신 내용과 (선택 입력 시) 이메일을 보관·이용합니다. 보관 기간은 처리 완료 후 30일 이내이며, 그 이후 자동 파기됩니다.';

interface SubmitState { status: 'idle' | 'submitting' | 'error'; error?: string }

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
        setState({ status: 'error', error: json?.error?.message ?? '제출에 실패했습니다.' });
        return;
      }
      router.push(`/correction/thank-you?id=${encodeURIComponent(json.id)}`);
    } catch {
      setState({ status: 'error', error: '네트워크 오류가 발생했습니다.' });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="요청자 유형" required>
        <div className="flex flex-wrap gap-2">
          {REQUESTER_OPTIONS.map((o) => (
            <label key={o.value} className="label-ko inline-flex cursor-pointer items-center gap-2 border border-hair bg-bg-elev px-3 py-2 has-[:checked]:border-lime has-[:checked]:bg-lime has-[:checked]:text-bg">
              <input
                type="radio"
                name="requesterType"
                value={o.value}
                defaultChecked={o.value === 'general'}
                required
                className="sr-only"
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </Field>

      <Field label="대상 후보 ID (선택)">
        <input id="targetCandidateId" name="targetCandidateId" type="text" defaultValue={prefilledCandidateId} placeholder="예: cand_002" className="label-ko w-full border border-hair bg-bg px-3 py-2 text-ink placeholder:text-dim" />
      </Field>

      <Field label="대상 항목 (선택)">
        <input id="targetField" name="targetField" type="text" placeholder="예: 재산총액, 전과 기록, 공약 본문" className="w-full border border-hair bg-bg px-3 py-2 text-sm text-ink placeholder:text-dim" />
      </Field>

      <Field label="사실관계" required>
        <textarea id="factualClaim" name="factualClaim" required minLength={5} rows={5} placeholder="수정이 필요한 항목과 사실관계를 차분히 적어주세요. 추정·평가·인격적 표현은 검수에서 제외될 수 있습니다." className="w-full border border-hair bg-bg px-3 py-2 text-sm text-ink placeholder:text-dim" />
      </Field>

      <Field label="근거 링크 (권장)">
        <input id="evidenceUrl" name="evidenceUrl" type="url" placeholder="https://..." className="label-ko w-full border border-hair bg-bg px-3 py-2 text-ink placeholder:text-dim" />
        <p className="label-ko mt-1 text-dim">
          현재 첨부는 지원하지 않습니다. 근거 링크를 활용해 주세요.
        </p>
      </Field>

      <Field label="회신용 이메일 (선택)">
        <input id="email" name="email" type="email" placeholder="me@example.com" className="label-ko w-full border border-hair bg-bg px-3 py-2 text-ink placeholder:text-dim" />
      </Field>

      <fieldset className="border border-lime/40 bg-lime/[0.06] p-4 text-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="consent" required className="mt-1.5 h-3.5 w-3.5 border-lime accent-lime" />
          <span className="text-ink/85">{CONSENT_TEXT}</span>
        </label>
      </fieldset>

      {state.status === 'error' ? (
        <p className="label-ko border border-[#5b2424] bg-[#2a1414] px-3 py-2 text-[#e09b9b]">
          오류 · {state.error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-hair pt-5">
        <p className="label-ko text-dim">
          접수 후 자동 응답은 보내지 않습니다. 처리 결과는 자료 갱신으로 반영됩니다.
        </p>
        <button
          type="submit"
          disabled={state.status === 'submitting'}
          className="label-ko-lg inline-flex items-center gap-2 border border-ink bg-ink px-4 py-2.5 text-bg transition-colors hover:bg-cyan hover:border-cyan disabled:opacity-40"
        >
          {state.status === 'submitting' ? '제출 중…' : '수정 요청 보내기 →'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="font-ko text-sm font-semibold text-ink">{label}</span>
        {required ? <span className="label-ko text-[#e09b9b]">필수</span> : null}
      </div>
      {children}
    </div>
  );
}
