// 공약 구체성 — PRD §9.5 점수 0~5 → 라벨 (결정 D5)
// 5요소 (목표·예산·기간·주체·지표) — 본 함수는 정수 점수에서 라벨로 변환만 수행.

export type SpecificityLabel = '낮음' | '보통' | '높음';

export function specificityLabel(score: number): SpecificityLabel {
  if (score <= 1) return '낮음';
  if (score <= 3) return '보통';
  return '높음';
}

/** 평균 점수를 1자리로 반올림 (결정 D7) */
export function avgSpecificity(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}
