# [#2] 도메인 타입 & mock 시드 데이터

## 목적
PRD §8의 8개 엔티티를 TypeScript 타입으로 정의하고, 테스트 지역 1곳 분량의 mock 시드 데이터를 작성한다. 이후 모든 화면이 이 시드를 통해 데이터를 받는다.

> 참조: PRD §5.1, §8, §20.2

## 산출물

```
types/
└── domain.ts                  # 8개 엔티티 + 공통 enum

mocks/
├── seed.ts                    # 시드 데이터 (단일 export)
├── loader.ts                  # 조회 함수
└── README.md                  # 시드 편집 가이드
```

## 타입 정의 (`types/domain.ts`)

PRD §8의 필드명·타입과 1:1 일치시킨다. 추가 enum:

```ts
export type ElectionStatus = 'draft' | 'active' | 'archived';
export type ReviewStatus = 'pending' | 'reviewed' | 'needs_check';
export type CandidateStatus = 'active' | 'withdrawn' | 'unknown';
export type CheckCardType =
  | 'criminal_record'
  | 'tax_arrears'
  | 'asset'
  | 'military'
  | 'promise_specificity'
  | 'source_missing';
export type Severity = 'info' | 'check' | 'high_attention';
export type PromiseSourceType = 'nec_policy' | 'manual' | 'candidate_booklet';

export interface Election { /* PRD §8.1 */ }
export interface District { /* §8.2 */ }
export interface Candidate { /* §8.3 */ }
export interface CandidateDisclosure { /* §8.4 */ }
export interface Promise { /* §8.5 — Promise는 글로벌 Promise와 충돌하므로 export type CandidatePromise = Promise 또는 이름 변경 권장 */ }
export interface CandidateCheckCard { /* §8.6 */ }
```

**주의**: `Promise`는 JS 글로벌과 충돌 → **`CandidatePromise`로 리네이밍 권장**. PRD 표기와는 매핑 주석을 단다.

추가 보조 타입:

```ts
export interface CompareRow {
  candidate: Candidate;
  disclosure: CandidateDisclosure | null;
  promiseCount: number;
  avgSpecificity: number;
  assetRankInDistrict: number | null;  // 1-based
  badges: BadgeKind[];
}
export type BadgeKind =
  | 'criminal_record_present'
  | 'tax_arrears_present'
  | 'asset_top_quintile'
  | 'military_disclosed'
  | 'promise_specificity_high'
  | 'data_pending';
```

## Loader API (`mocks/loader.ts`)

```ts
export function listElections(opts?: { includeArchived?: boolean }): Election[];
export function getElection(id: string): Election | null;
export function listDistricts(electionId: string): District[];
export function getDistrict(id: string): District | null;
export function listCandidates(
  districtId: string,
  opts?: { includeUnreviewed?: boolean }
): Candidate[];
export function getCandidate(id: string): Candidate | null;
export function getDisclosure(candidateId: string): CandidateDisclosure | null;
export function listPromises(candidateId: string): CandidatePromise[];
export function listCheckCards(candidateId: string): CandidateCheckCard[];
export function getCompareData(districtId: string): CompareRow[];
```

- 기본 동작: `reviewStatus !== 'reviewed'` 후보는 `includeUnreviewed: true`가 없으면 제외 (관리자 진입로 외 기본)
- 모든 함수는 **동기 / 순수 함수** (시드 객체에서 in-memory 조회)
- 응답 객체는 항상 **불변 복사** 반환 (deep clone) — UI에서 mutate 방지

## 시드 구성

### Election
- `id: "election_2026_local"`, `name: "2026 지방선거"`, `status: 'active'`
- `electionDate`, `sourceUrl`은 사람 결정 항목

### District (1개)
- 가상 지역 권장 (예: `name: "샘플 시 가나구청장"`)

### Candidate (4명)
다양한 케이스 커버 — 비교/필터/CrossCheck 기능 검증에 유리:

| # | 시나리오 | criminal | taxArrears | asset 분위 | specificity | reviewStatus |
|---|---|---|---|---|---|---|
| 1 | 무난한 후보 | 없음 | 없음 | 하위 | 높음 | reviewed |
| 2 | 전과 공개 + 청렴 공약 | 있음 | 없음 | 중위 | 보통 | reviewed |
| 3 | 체납 공개 + 부동산 상위 + 주거 공약 | 없음 | 있음(과거) | 상위 | 낮음 | reviewed |
| 4 | 자료 미입력 (시연용 비노출 케이스) | null | null | null | n/a | needs_check |

각 후보당:
- Promise: 5~8개 (5개 분야 분산: 주거/교통/복지/교육/조세)
- CheckCard: 3~5개

### sourceUrl 처리
- 모든 sourceUrl 은 `https://example.test/...` placeholder 권장
- 실제 selectorVolt URL은 #13(향후) 실데이터 입력 단계에서 교체

## 수용 기준
- [ ] PRD §8의 8개 엔티티 모두 TS 타입으로 정의되어 있고 필드명/타입이 1:1 일치
- [ ] 모든 시드 데이터가 `tsc --noEmit` 통과
- [ ] `mocks/loader.ts`의 9개 함수 모두 구현
- [ ] `getCompareData`가 District 내 후보 자산 순위를 동적으로 계산
- [ ] 모든 금액 필드는 **원 단위** (예: 12억 3,400만 → `1234000000`) — PRD §12.2
- [ ] `reviewStatus !== 'reviewed'` 후보가 기본 조회에서 제외됨
- [ ] `mocks/README.md`에 "후보 추가하는 방법", "정정 후 시드 업데이트 절차" 문서화
- [ ] Loader 반환값을 mutate 해도 시드가 변경되지 않음 (deep clone 테스트)

## 의존
- #1

## Out of scope
- 실제 선관위 데이터 (placeholder로 충분)
- CSV/JSON 임포트 자동화 (#13 후속 이슈)
- 시드 외부 파일화(.json 분리) — 단일 ts 파일로 시작

## 🚨 사람 결정 필요

- [ ] **테스트 지역 표기**: 실제 선거구명(예: "서울 종로구청장") vs 가상명("샘플 시 가나구청장")
  - 권장: **가상명** (mock 시연 시 비당파성 오해/실제 후보 이름 노출 위험 회피)
- [ ] **후보 수**: 3 / **4(권장)** / 5
- [ ] **정당명**: 실제 정당명 / 가상 ("정당 A·B·C") / 무소속 표기
  - 권장: **가상** (실제 정당과 mock 시나리오 연결되어 부정확 인식 우려)
- [ ] **민감 데이터 수치 가이드**: 전과 건수, 체납 금액, 재산 총액의 예시 범위
  - 예: "전과 1건 (도로교통법 위반)", "체납 1,200만 원(2019)", "재산 15억 원"
  - PRD §9 권장 문구를 따르되, 운영자 검토가 필요
- [ ] **선거 종류**: 지방선거 / 국회의원 / 대통령 (스키마는 동일하나 시드 문구가 다름)
- [ ] **`CandidatePromise` 네이밍**: `Promise` 글로벌과 충돌 → `CandidatePromise` 권장 vs `Pledge` vs PRD 그대로 유지
- [ ] **자료 기준일 표기 포맷**: ISO `2026-05-20` vs 한국식 `2026년 5월 20일` — 저장은 ISO, 표시 위치별 결정 필요
- [ ] **운영자 ID(reviewedBy)**: mock에선 `"admin"` 고정 vs 익명
