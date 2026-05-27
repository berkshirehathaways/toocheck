// 확인 필요도 — PRD §10 점수 0~160 → 라벨 (결정 D4)
// 가중치는 mocks/loader.ts의 computeCheckPriority와 동일 (PR-2에서 임시로 인라인된 로직을 이 모듈로 통합).

import type { CandidateCheckCard, Severity } from '@/types/domain';

const W_CRIMINAL: Record<Severity, number> = {
  info: 0,
  check: 30,
  high_attention: 50,
};
const W_TAX: Record<Severity, number> = {
  info: 0,
  check: 25,
  high_attention: 45,
};
const W_ASSET: Record<Severity, number> = {
  info: 0,
  check: 15,
  high_attention: 25,
};
const W_SPECIFICITY_LOW = 20;
const W_SOURCE_MISSING = 10;
const MAX_SCORE = 160;

export interface CheckPriorityResult {
  score: number;
  label: '기본 공개자료 확인 완료' | '확인할 항목이 일부 있음' | '확인할 항목이 많음';
}

export function computeCheckPriority(cards: CandidateCheckCard[]): CheckPriorityResult {
  let score = 0;
  for (const c of cards) {
    if (c.type === 'criminal_record') score += W_CRIMINAL[c.severity] ?? 0;
    else if (c.type === 'tax_arrears') score += W_TAX[c.severity] ?? 0;
    else if (c.type === 'asset') score += W_ASSET[c.severity] ?? 0;
    else if (c.type === 'promise_specificity' && c.severity === 'high_attention')
      score += W_SPECIFICITY_LOW;
    else if (c.type === 'source_missing') score += W_SOURCE_MISSING;
  }
  score = Math.min(score, MAX_SCORE);
  const label: CheckPriorityResult['label'] =
    score <= 30
      ? '기본 공개자료 확인 완료'
      : score <= 70
        ? '확인할 항목이 일부 있음'
        : '확인할 항목이 많음';
  return { score, label };
}
