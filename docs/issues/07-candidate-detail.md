# [#7] 후보 상세 페이지

## 목적
후보 1명의 공개정보·공약·"함께 확인할 지점"을 한 화면에 모은다. **서비스의 핵심 차별점이자 가장 민감한 부분**.

> 참조: PRD §6.4, §9, §11, §16.3

## 산출물

```
app/(public)/candidates/[candidateId]/
└── page.tsx

components/domain/
├── CandidateHeader.tsx
└── CrossCheckSection.tsx          # CrossCheckBlock 래퍼 (#4의 컴포넌트 사용)

lib/
└── cross-check.ts                  # 매칭 룰 엔진
```

## 페이지 구성

### 0. 상단 sticky anchor nav
- `공개정보` / `공약` / `함께 확인할 지점` / `정정 요청`
- 스크롤 시 강조 표시

### 1. 헤더 (`<CandidateHeader>`)
- 기호 · 후보명 · 정당명
- 사진 (placeholder)
- 공개자료 기준일
- 원문 링크 2개: `profileSourceUrl`, `publicDisclosureSourceUrl`
- 정정 요청 진입 버튼 (헤더 우측)

### 2. 공개정보 확인 카드 (`<DisclosureCard>`)
4개 서브카드 (PRD §9):
- **재산**: total / 부동산 / 예금 / 증권 / 채무 / 부동산 비중 / 후보군 내 분위
- **납세 및 체납**: 5년 납세 / 체납 공개 / 현재 체납
- **병역**: status (raw text)
- **전과**: count + raw text

각 카드마다 `<SourceLink>` 필수.

### 3. 공약 카드 (`<PromiseCard>` list)
- 분야(area)별 그룹화
- 각 공약: 제목 / 본문 / 분야 / 대상 / 구체성 점수(5요소 체크리스트)
- 출처 표시
- 분야별 정렬: PRD §22.2 향후 확장 고려

### 4. 함께 확인할 지점 (`<CrossCheckSection>`)

**서비스의 핵심 차별점. 가장 보수적으로 구현한다.**

매칭 룰 엔진 (`lib/cross-check.ts`):

```ts
export interface CrossCheckRule {
  id: string;
  promiseKeywords: string[];           // 공약 본문/제목에서 매칭
  disclosureCondition: (
    d: CandidateDisclosure,
    ctx: { isAssetTopQuintile: boolean; isRealEstateTopQuintile: boolean }
  ) => boolean;
  template: (candidateName: string) => string;   // PRD §11 권장 문구만 반환
}

export const CROSS_CHECK_RULES: CrossCheckRule[] = [
  // 1. 주거/도시계획 공약 + 부동산 비중 상위
  { /* PRD §11 예시1 문구 */ },
  // 2. 조세/예산 공약 + 체납 공개자료
  { /* PRD §11 예시2 문구 */ },
  // 3. 청렴/공정 공약 + 전과 공개자료
  { /* PRD §11 예시3 문구 */ },
];

export function evaluateCrossCheck(
  candidate: Candidate,
  disclosure: CandidateDisclosure | null,
  promises: CandidatePromise[]
): { ruleId: string; text: string }[];
```

규칙:
- **PRD §11 권장 문구 템플릿만 사용** (자유 텍스트 불가)
- 모든 출력은 `assertNoForbiddenWords()` 통과
- 매칭 0건이면 섹션 자체 비표시
- 시드에 운영자 작성 문구가 있으면 우선 사용 (선택, 사람 결정 항목)

### 5. 정정 요청 진입 (페이지 하단)
- "이 후보 정보에서 잘못된 부분이 있나요?" → `/correction?candidateId=...`

## 데이터 흐름
- 서버 컴포넌트에서 loader 직접 호출
- `evaluateCrossCheck`는 서버에서 실행 → 결과만 클라이언트로

## needs_check 후보 처리
- 헤더 + 정정 요청만 표시
- 공개정보/공약 섹션은 `<DataPendingNote>`로 대체
- CrossCheck 섹션은 미표시

## 수용 기준
- [ ] 모든 민감 항목 옆에 `<SourceLink>` 노출 (PRD §16.3)
- [ ] null/빈값은 `<DataPendingNote>` 또는 `"공개자료 없음"` 일관 표시 (PRD §9.1)
- [ ] 공약 구체성 산식 설명 툴팁/모달 제공 (PRD §16.3)
- [ ] 정정 요청 버튼이 헤더 + 푸터 양쪽 존재
- [ ] CrossCheckSection 출력 텍스트 100%가 PRD §11 템플릿 기반
- [ ] needs_check 후보는 민감 섹션 대신 안내 표시
- [ ] 페이지 본문에 금지어 0건
- [ ] anchor nav 클릭 시 해당 섹션으로 스크롤

## 의존
- #2, #3, #4

## Out of scope
- 댓글 / 평가
- 후보 본인 인증
- 후보별 사진 자체 호스팅 (placeholder)

## 🚨 사람 결정 필요

- [ ] **CrossCheck 텍스트 출처**:
  - (A) 룰 매칭 자동 생성 (권장)
  - (B) 시드에 운영자 작성 문구만 사용
  - (C) **둘 다 — 운영자 작성 우선, 없으면 룰 매칭** (권장)
- [ ] **공약 키워드 사전 범위**: PRD §11 3개 외 추가 카테고리
  - 후보 카테고리: `교통 · 복지 · 교육 · 환경 · 안전 · 청년 · 노인 · 산업`
- [ ] **매칭 임계값**: "부동산 비중 상위" 의 정확한 기준 (상위 20%? 50%↑?)
  - 권장: **상위 20%** (§10과 일관)
- [ ] **레이아웃**: 탭 vs 단일 스크롤 + sticky anchor
  - 권장: **단일 스크롤 + sticky anchor** (모바일 친화, 인쇄 친화)
- [ ] **사진**:
  - placeholder만 (권장)
  - 시드 내 이미지 경로 추가
  - 외부 호스팅 URL (저작권 검토 필요)
- [ ] **공약 카드 펼침 기본 상태**: 기본 펼침(권장) vs 접힘
- [ ] **CrossCheck 섹션 위치**: 본문 끝 (권장) vs 본문 중간 vs 헤더 직후
- [ ] **needs_check 후보에 어디까지 보일지**: 헤더+이름만 vs + 정당명까지
