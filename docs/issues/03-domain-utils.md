# [#3] 도메인 유틸 함수

## 목적
화면 전반에서 사용할 도메인 로직(금지어 검사, 단위 변환, 점수 산정 등)을 **순수 함수**로 분리. 단위 테스트로 PRD 규칙을 강제한다.

> 참조: PRD §9.5, §10, §12.2, §17, §20.5

## 산출물

```
lib/
├── forbidden-words.ts
├── format-krw.ts
├── format-date.ts
├── promise-specificity.ts
├── check-priority.ts
└── source-url.ts

__tests__/lib/
├── forbidden-words.test.ts
├── format-krw.test.ts
├── promise-specificity.test.ts
└── check-priority.test.ts
```

## API 명세

### `forbidden-words.ts`

```ts
export const FORBIDDEN_WORDS: readonly string[] = [
  // PRD §17
  '범죄자', '비리', '구린', '부자 후보', '세금 도둑',
  '위험 후보', '낙선해야', '뽑으면 안', '내로남불', '위선',
  // §6.3 금지 배지
  '범죄 후보', '체납 후보', '부자 후보',
  // §10 금지 표시
  '위험도 높음', '문제 많음', '비리 가능성', '낙선 추천',
  // §11 금지 문구
  '말과 행동이 다릅', '내로남불입', '위선적입', '이해충돌입',
];

export function findForbiddenWords(text: string): string[];
export function containsForbiddenWord(text: string): boolean;

/** dev에서 throw, prod에서 console.warn */
export function assertNoForbiddenWords(text: string, context?: string): void;
```

### `format-krw.ts`

```ts
/** "1억 2,345만 6,789원" 형식 (긴 표기) */
export function formatKrw(won: number | null | undefined): string;

/** "1.2억" 형식 (짧은 표기, 카드/배지용) */
export function formatKrwShort(won: number | null | undefined): string;

/** "공개자료 없음" 통일 문구 */
export const FALLBACK_TEXT = '공개자료 없음';
```

### `format-date.ts`

```ts
/** "2026-05-20" → "2026년 5월 20일 기준" */
export function formatSourceDate(iso: string | Date): string;
```

### `promise-specificity.ts`

```ts
export interface SpecificityInput {
  beneficiary: string | null;
  budgetMentioned: boolean;
  periodMentioned: boolean;
  ownerMentioned: boolean;
  metricMentioned: boolean;
}
/** 0~5점 (beneficiary는 non-null이면 1점) */
export function calcSpecificityScore(input: SpecificityInput): number;

export type SpecificityLevel = '높음' | '보통' | '낮음';
export function specificityLevel(score: number): SpecificityLevel;
```

### `check-priority.ts` (PRD §10)

```ts
export interface CheckPriorityInput {
  hasCriminalRecord: boolean;
  hasTaxArrears: boolean;
  hasCurrentTaxArrears: boolean;
  assetInTopQuintile: boolean;
  realEstateInTopQuintile: boolean;
  lowSpecificity: boolean;
  missingSourceLink: boolean;
  notReviewed: boolean;
}
/** 가중치: 30/25/30/10/10/15/20/20 */
export function calcCheckPriority(input: CheckPriorityInput): number;

export type CheckPriorityLabel =
  | '기본 공개자료 확인 완료'
  | '확인할 항목이 일부 있음'
  | '확인할 항목이 많음';
export function checkPriorityLabel(score: number): CheckPriorityLabel;
```

### `source-url.ts`

```ts
/** http(s) only, hostname required */
export function isValidSourceUrl(url: string): boolean;

/** null if invalid */
export function sanitizeSourceUrl(url: string): string | null;
```

## 수용 기준

- [ ] 모든 함수가 **순수 함수** (DOM/fetch/Date.now 등 의존 없음)
- [ ] 각 유틸별 unit test, line coverage ≥ 80%
- [ ] `findForbiddenWords('이 후보는 위선적이다')` → `['위선', '위선적입']` 매칭
- [ ] `formatKrw(0)` === `'0원'`
- [ ] `formatKrw(null)` === `'공개자료 없음'`
- [ ] `formatKrw(123_456_789)` === `'1억 2,345만 6,789원'`
- [ ] `formatKrwShort(1_234_567_890)` === `'12.3억'`
- [ ] `calcSpecificityScore({ beneficiary: null, budget...: false × 4 })` === `0`
- [ ] `calcSpecificityScore` 5요소 모두 true → `5`
- [ ] `calcCheckPriority` 모두 false → `0`
- [ ] `calcCheckPriority` 모두 true → `160` (30+25+30+10+10+15+20+20)
- [ ] `assertNoForbiddenWords` dev에서 throw, prod에서 console.warn만
- [ ] `isValidSourceUrl('javascript:alert(1)')` === `false`

## 의존
- #1

## Out of scope
- React 컴포넌트화 (#4)
- 자료 기준일과 현재 시각 비교 (선거 종료 후 노출 정책 — 별도 이슈)

## 🚨 사람 결정 필요

- [ ] **확인 필요도 라벨 임계값** (PRD §10 점수→라벨 매핑이 없음)
  - 제안: `0~30 "완료"` / `31~70 "일부 있음"` / `71+ "많음"`
- [ ] **구체성 라벨 임계값** (PRD §9.5는 점수만 명시)
  - 제안: `0~1 "낮음"` / `2~3 "보통"` / `4~5 "높음"`
- [ ] **재산 상위 20% 판정 위치**: District 단위 동적 계산(권장) vs 시드에 미리 boolean 저장 vs Election 단위
- [ ] **금지어 매칭 방식**: 부분 일치(현재안, 한국어 친화) vs 단어 경계 일치
  - 부분 일치는 오탐 가능 (예: '위선' → '위선자' 외에 다른 정상 단어와 충돌 가능성 낮으나 검토 필요)
- [ ] **금지어 추가**: 운영자가 §17 외에 추가하고 싶은 표현이 있는지
- [ ] **`formatKrwShort` 소수점 자릿수**: 1자리 vs 0자리 (예: `12.3억` vs `12억`)
- [ ] **`assertNoForbiddenWords` 동작**: prod에서 throw vs warn
  - 권장: **dev throw / prod warn** (배포 후 사용자에게 화면 깨짐 방지)
- [ ] **`Date` 기준 타임존**: `Asia/Seoul` 고정 vs 사용자 로컬
  - 권장: **`Asia/Seoul` 고정** (서비스 대상이 국내 유권자)
