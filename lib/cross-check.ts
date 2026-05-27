// 함께 확인할 지점 — 결정 D1: 운영자 작성 우선 → 자동 룰 매칭 → 둘 다 없으면 미표시
// 키워드 사전 8개 (결정 D2): 주거·조세·청렴·교통·복지·교육·환경·안전
// 모든 출력 텍스트는 호출 측에서 assertNoForbiddenWords 통과 필요.

import type { CandidatePromise, CompareRow, PromiseCategory } from '@/types/domain';

interface AutoRule {
  match: (row: CompareRow, p: CandidatePromise) => boolean;
  text: (row: CompareRow, p: CandidatePromise) => string;
}

const RULES: Partial<Record<PromiseCategory, AutoRule[]>> = {
  housing: [
    {
      match: (row) => row.assetInTopQuintile,
      text: () =>
        '본 후보는 부동산 비중이 District 내 상위 분위에 해당하는 공개 자료가 있습니다. 주거 분야 공약의 영향 범위(임대·매매·재건축 등)를 함께 살펴보는 것이 좋습니다.',
    },
  ],
  tax: [
    {
      match: (row) =>
        (row.disclosure?.taxArrears && row.disclosure.taxArrears.length > 0) ?? false,
      text: () =>
        '본 후보는 과거 체납 후 완납·미납 공개 자료가 있습니다. 조세 공약의 적용 항목과 재원 마련 방안을 함께 살펴볼 것을 권장합니다.',
    },
  ],
  integrity: [
    {
      match: (row) =>
        (row.disclosure?.criminalRecords && row.disclosure.criminalRecords.length > 0) ??
        false,
      text: () =>
        '본 후보는 공개된 전과 자료가 있습니다. 청렴 분야 공약의 실행 체계(공시·감사·평가)를 함께 살펴보는 것이 좋습니다.',
    },
  ],
  transport: [],
  welfare: [],
  education: [],
  environment: [],
  safety: [],
};

export interface CrossCheckPoint {
  promiseId: string;
  text: string;
  source: 'manual' | 'auto';
}

export function buildCrossCheckPoints(
  row: CompareRow,
  promises: CandidatePromise[]
): CrossCheckPoint[] {
  const out: CrossCheckPoint[] = [];
  for (const p of promises) {
    // 1순위: 운영자 작성 (manual)
    if (p.crossCheckText && p.crossCheckText.trim().length > 0) {
      out.push({ promiseId: p.id, text: p.crossCheckText.trim(), source: 'manual' });
      continue;
    }
    // 2순위: 자동 룰 매칭
    const rules = RULES[p.category];
    if (!rules) continue;
    const hit = rules.find((r) => r.match(row, p));
    if (hit) {
      out.push({ promiseId: p.id, text: hit.text(row, p), source: 'auto' });
    }
    // 3순위 (없으면 미표시): 아무것도 추가하지 않음
  }
  return out;
}
