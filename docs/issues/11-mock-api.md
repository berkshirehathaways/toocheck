# [#11] Mock API routes

## 목적
화면이 **API 계약을 통해** 데이터를 받게 하여 추후 실DB로 교체 시 변경 범위를 최소화한다.

> 참조: PRD §15

## 산출물

```
app/api/
├── elections/route.ts
├── districts/route.ts                       # ?electionId=
├── candidates/
│   ├── route.ts                              # ?districtId=
│   └── [id]/route.ts
├── compare/route.ts                          # ?districtId=
├── share-card/route.ts                       # POST (#9에서 실구현)
└── correction-requests/route.ts              # POST (#10에서 실구현)

lib/api/
├── types.ts                                  # 요청/응답 DTO
├── client.ts                                 # fetch wrapper
└── errors.ts                                 # 표준 에러 포맷
```

## DTO 예시

```ts
// lib/api/types.ts
export interface ElectionDTO { /* Election + 표시 가공치 */ }
export interface DistrictDTO { /* District */ }
export interface CandidateSummaryDTO {
  id: string;
  candidateNumber: number;
  name: string;
  partyName: string;
  badges: BadgeKind[];
  topPromises: { title: string; specificityScore: number }[];   // 최대 2
  sourceCheckedAt: string;
  reviewStatus: ReviewStatus;
}
export interface CandidateDetailDTO {
  basicInfo: Candidate;
  disclosure: CandidateDisclosure | null;
  promises: CandidatePromise[];
  checkCards: CandidateCheckCard[];
  sourceUrls: { profile: string; disclosure: string };
  correctionUrl: string;
  sourceCheckedAt: string;
  reviewStatus: ReviewStatus;
}
export interface CompareDTO {
  district: DistrictDTO;
  rows: CompareRow[];
  sourceCheckedAt: string;     // District 내 최소값
}
export interface ApiError {
  error: { code: string; message: string };
}
```

## 동작 원칙

- 모든 GET은 `mocks/loader.ts`에서 동기 조회 후 JSON 반환
- ENV `MOCK_API_DELAY_MS` 있으면 `await sleep(n)`로 지연 시뮬
- 기본 `reviewStatus !== 'reviewed'` 후보 제외, `?includeUnreviewed=true` 시 포함
- 에러 표준화:
  - 404: `{ error: { code: 'not_found', message: '...' } }`
  - 400: `{ error: { code: 'bad_request', message: '...' } }`
- 응답에 `Cache-Control: no-store` (mock 단계)

## API 명세 (PRD §15)

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/api/elections` | — | `{ items: ElectionDTO[] }` |
| GET | `/api/districts` | `electionId` | `{ items: DistrictDTO[] }` |
| GET | `/api/candidates` | `districtId, sort?, includeUnreviewed?` | `{ items: CandidateSummaryDTO[] }` |
| GET | `/api/candidates/[id]` | — | `CandidateDetailDTO` |
| GET | `/api/compare` | `districtId, sort?` | `CompareDTO` |
| POST | `/api/share-card` | body | image/png |
| POST | `/api/correction-requests` | body | `CorrectionRequestResponse` |

## client.ts

```ts
export const apiClient = {
  listElections: () => fetchJson<{ items: ElectionDTO[] }>('/api/elections'),
  listDistricts: (electionId: string) => ...,
  listCandidates: (districtId: string, sort?: SortKey) => ...,
  getCandidate: (id: string) => ...,
  getCompare: (districtId: string, sort?: SortKey) => ...,
  submitCorrection: (payload: CorrectionRequestPayload) => ...,
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T>;
```

## 서버 컴포넌트 vs 클라이언트 컴포넌트

**권장 패턴**:
- 서버 컴포넌트는 **loader 직접 호출** (성능 ↑, 네트워크 hop 제거)
- 클라이언트 컴포넌트(정렬 변경, 폼 제출)만 `/api` 호출
- 향후 실DB 전환 시 loader 함수의 시그니처만 유지하면 됨

## 수용 기준

- [ ] PRD §15의 7개 API 모두 구현
- [ ] `lib/api/types.ts` 에 모든 응답 DTO 정의
- [ ] 클라이언트 컴포넌트가 `apiClient`만 사용 (mocks 직접 import 금지)
- [ ] 모든 응답이 JSON Schema 또는 zod 스키마 검증 (선택)
- [ ] 404/400 에러 표준 포맷
- [ ] `MOCK_API_DELAY_MS=500` 환경변수로 지연 시뮬 가능
- [ ] `?includeUnreviewed=true` 미지정 시 needs_check 후보 제외

## 의존
- #2, #3

## Out of scope
- 인증/인가
- 캐싱 헤더 튜닝
- 실DB 연결
- GraphQL

## 🚨 사람 결정 필요

- [ ] **서버 컴포넌트의 데이터 접근 방식**:
  - **A. 서버=loader 직접, 클라=API** (권장, 성능)
  - B. 모두 API 통일 (일관성, 부하 발생)
- [ ] **share-card 응답 형식**: image/png 스트림 (권장) vs base64 JSON vs URL
- [ ] **correction-requests 영속화**: 메모리(권장) / 로컬 JSON / SQLite
- [ ] **페이지네이션 도입 여부**: 후보 8명 이하라 불필요 (권장)
- [ ] **응답 zod 검증**: 도입(안정성↑, 코드량↑) vs 미도입(권장, mock 단계)
- [ ] **`/api/candidates` 의 sort 처리 위치**: API에서 정렬 (권장, URL 공유) vs 클라이언트에서 정렬
- [ ] **에러 코드 표준**: 자체 정의 (`not_found`, `bad_request`...) vs HTTP status만
