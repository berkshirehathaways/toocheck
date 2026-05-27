// 금지어 사전 — PRD §17 (10) + §6.3 (3) + §10 (4) + §11 (4) ≈ 21개 기본 (결정 B5)
// 매칭 방식: 부분 일치 (결정 B6 — 한국어 형태소 분석 없이 어미·조사 변형 커버)
// 운영 정책: dev throw / prod console.warn (결정 F23)

export const FORBIDDEN_WORDS: readonly string[] = Object.freeze([
  // §17 - 정치적·인격적 단정 표현
  '범죄자',
  '부패',
  '비리',
  '사이비',
  '독재',
  '극우',
  '극좌',
  '빨갱이',
  '친일',
  '반역',
  // §6.3 - 후보 카드 어조
  '위선',
  '거짓말',
  '약속 어김',
  // §10 - 확인 필요도 라벨 금지
  '위험',
  '위험도',
  '의심',
  '문제 후보',
  // §11 - CrossCheck 단정 표현
  '의혹',
  '폭로',
  '단정',
  '확실',
]);

export interface ForbiddenMatch {
  word: string;
  context: string;
}

export function findForbiddenWords(text: string): ForbiddenMatch[] {
  if (!text) return [];
  const out: ForbiddenMatch[] = [];
  for (const w of FORBIDDEN_WORDS) {
    const idx = text.indexOf(w);
    if (idx >= 0) {
      const start = Math.max(0, idx - 10);
      const end = Math.min(text.length, idx + w.length + 10);
      out.push({ word: w, context: text.slice(start, end) });
    }
  }
  return out;
}

export function assertNoForbiddenWords(text: string, location?: string): void {
  const hits = findForbiddenWords(text);
  if (hits.length === 0) return;
  const msg = `[forbidden-words] ${location ?? 'text'} contains: ${hits
    .map((h) => `"${h.word}"`)
    .join(', ')}`;
  if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line no-console
    console.warn(msg);
  } else {
    throw new Error(msg);
  }
}
