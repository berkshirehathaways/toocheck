// 함께 확인할 지점 — 결정 D1 재검토:
//   기존: 운영자 작성 우선 → 자동 룰 매칭 → 둘 다 없으면 미표시
//   변경: **운영자 작성만 표시**. 자동 룰 매칭은 제거.
//
// 변경 사유 (2026-05-28):
//   - 자동 룰이 가상의 placeholder 데이터에 잘못 트리거되어 후보를 부정확하게 묘사하는 사례 발견
//   - "District 내 상위 분위" 등 영문/통계 용어가 일반 유권자에게 불친절
//   - 권유성 멘트("…를 함께 살펴보는 것이 좋습니다")가 자동 생성될 경우 정치적 인상 형성 위험
//   - 결과적으로 PRD §3·§17 비당파성 / §11 "서비스가 의혹을 만들지 않는다" 원칙과 충돌 가능
//
// 모든 출력 텍스트는 호출 측에서 assertNoForbiddenWords 통과 필요.

import type { CandidatePromise, CompareRow } from '@/types/domain';

export interface CrossCheckPoint {
  promiseId: string;
  text: string;
  source: 'manual';
}

export function buildCrossCheckPoints(
  _row: CompareRow,
  promises: CandidatePromise[]
): CrossCheckPoint[] {
  const out: CrossCheckPoint[] = [];
  for (const p of promises) {
    if (p.crossCheckText && p.crossCheckText.trim().length > 0) {
      out.push({ promiseId: p.id, text: p.crossCheckText.trim(), source: 'manual' });
    }
  }
  return out;
}
