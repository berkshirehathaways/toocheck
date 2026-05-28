# #15 — 직책별 차별화 합의사항 + 수집 파이프라인 가동 검토

> **상태**: 합의사항 확정 / 파이프라인 가동 절차 명세. 2026-05-28 종로구 sgType=6 매핑 정정 사이클 종료.

## 0. 배경 — 누락 발견 (sgType=6 정정)

2026 지방선거 7개 선거 중 **기초의원 지역구 ~4,400명**이 1차 전국 크롤에서 빠짐.

| 원인 | 내용 |
|---|---|
| 가정 오류 | NEC info.nec의 표준 sgTypecode 매핑(`7 = 기초의원 지역구`)을 그대로 사용 |
| 실제 | policy.nec UI 라벨 확인 결과 **`sgType=6` = 구·시·군의회의원선거** (= 기초의원 지역구) |
| 회복 | `01b-fetch-national-roster.ts` SG_TYPES에 6 추가 → 재크롤 → 7,335 엔트리 확보 |

NEC가 사이트마다 sgTypecode 매핑이 미묘하게 다름 — info.nec/policy.nec/Open API 각각 다른 규약 사용. 이번 발견 이후 **policy.nec UI 라벨을 정본**으로 채택.

## 1. 직책별 차별화 — 7개 합의사항

2026 지방선거 7개 직책의 데이터 수집/표시 규칙. 코드는 `types/domain.ts`의 `OFFICE_PROFILES` 단일 소스.

| # | OfficeKind | sgType | 선거명 | 정당 | 5대공약 | 비례 | 강조 필드 |
|---|---|---|---|---|---|---|---|
| A1 | `metropolitan_governor` | 3 | 시·도지사 | O | O | — | career·councilTerms |
| A2 | `education_superintendent` | 11 | 교육감 | **X (법률)** | O | — | education·educationCareer |
| A3 | `basic_governor` | 4 | 구·시·군의 장 | O | O | — | career·councilTerms |
| A4 | `metropolitan_member` | 5 | 시·도의원 지역구 | O | O | — | councilTerms·career |
| A5 | `basic_member` | 6 | 구·시·군의원 지역구 | O | **X** | — | career |
| A6 | `metropolitan_proportional` | 8 | 광역의원 비례 | O | O | O | partyActivity·career |
| A7 | `basic_proportional` | 9 | 기초의원 비례 | O | **X** | O | partyActivity |

### A1·A3·A4 — 광역장/기초장/광역의원 (정당 + 5대공약)
모든 필드 정상 수집. UI 표준 카드.

### A2 — 교육감 (정당 공란)
- 법률(지방교육자치에 관한 법률 §22)상 정당 공천 금지 / 무소속 출마 의무.
- NEC 데이터에 `jdname`이 "없음" 또는 빈 값. 수집 시 그대로 저장.
- UI: 정당 라벨/색상 비표시. `nameEnglish` 자리에 교원자격증 보유 여부 표시 검토.
- 강조: `educationCareer` (교원·교장·교육청 경력) — 향후 별도 출처(교육부 공시) 보강.

### A5·A7 — 기초의원 (5대공약 비대상)
- NEC가 기초의원에 대해 5대공약 등록 의무를 부과하지 않음 (공직선거법 §66 등 의무선거 한정).
- policy.nec 응답에서 `ocrCnvrSeqNo`가 비어있어 03-fetch-promise-text.ts 호출 불가.
- UI: 공약 섹션에 "**NEC 5대공약 의무 비대상 — 공약 자료는 후보 자체 채널 참조**" 안내 + 후보 선거공보 PDF 링크.
- 체크리스트 통계에서 `necPromise`의 분모에서 제외 (자동 작동 — `07-update-checklist.ts`의 `isFlagApplicable`).

### A6·A7 — 비례대표 (정당명부)
- 후보 단위가 아닌 **정당명부 단위** (`kind=party_proportional`, `id=pty:{sgType}:{sggid}:{jdid}`).
- 명부 안의 개별 후보는 정당 공보 PDF 안에 있음 (현재 자동 추출 안 함).
- UI: 정당 카드 + "본 명부 N명" 표시. 후보 detail은 PDF 다운로드 링크 제공.
- `proportionalRank` 필드는 후보별 detail 수집 시 hbjgiho에서 복제.

## 2. UI 분기 규칙 — 5가지

| 규칙 | 적용 | 동작 |
|---|---|---|
| R1 | A2 | `Candidate.party` 칸 공란/비표시 |
| R2 | A6·A7 | `ballotNumber`를 "명부 N번"으로 라벨링 |
| R3 | A5·A7 | 공약 섹션에 "NEC 의무 비대상" 안내 + 후보 자체 자료 안내 |
| R4 | A2 | 인적사항에 교원자격증·학교/교육청 경력 표시 |
| R5 | A1·A3·A4·A6 | 시의회·국회 timeline (`councilTerms`) 표시 |

> R3 안내 문구 권장: "이 선거(직책)는 NEC의 5대공약 등록 의무 대상이 아닙니다. 후보 자료는 선거공보·후보 자체 채널을 참조하세요."

## 3. 수집 파이프라인 가동 절차

### 3.1 1차 명부 인덱싱 (전국 ~9분)

```bash
pnpm tsx scripts/ingest/01b-fetch-national-roster.ts
```

→ `data/curated/roster-2026.json` (7,335 엔트리 / 7 직책 / 18 시·도)

### 3.2 직책별 보강 (~2~6시간)

```bash
# 1차 — 정형 14필드 (모든 개인 후보 6,712명, idempotent)
pnpm tsx scripts/ingest/run-batch-detail.ts

# 2차 — 5대공약 (5대공약 의무 직책 + ocrCnvrSeqNo 있는 entry만, 자동 분기)
pnpm tsx scripts/ingest/run-batch-promise.ts

# 3차 — Wikidata (가드레일 — 출생일 일치하는 일부만 통과)
pnpm tsx scripts/ingest/run-batch-wikidata.ts      # ※ B3 미작성 (권장)
```

### 3.3 체크리스트 동기화

```bash
pnpm tsx scripts/ingest/07-update-checklist.ts
```

→ roster JSON의 `checklistStats` 갱신. 진행률 직책별 분모 자동 적용.

### 3.4 보완 항목 상태

| # | 파일 | 역할 | 상태 |
|---|---|---|---|
| B1 | `run-batch-detail.ts` | roster 순회 → 02 호출 → JSON 저장 (idempotent, rate, graceful) | ✅ **작성됨** |
| B2 | `run-batch-promise.ts` | `ocrCnvrSeqNo` 있는 + 5대공약 의무 직책만 03 호출 | ✅ **작성됨** |
| B3 | `run-batch-wikidata.ts` | 개인 후보 순회 → 06 호출 (rate 800ms, 가드레일 + nodetail skip) | ✅ **작성됨** |
| B4 | 세션 갱신 helper | HTTP 만료 시 재발급 | ✅ **불필요** — 03이 호출당 새 세션, 02는 세션 무관 |
| B5 | `02-parse-detail-html.ts` 보강 | 필수 필드 누락 시 throw | ✅ **B1에서 가드** (`name`·`birthDate` 검증) |
| B6 | 02 idempotent 옵션 | 기존 파일 있으면 skip | ✅ **B1/B2에 내장** (`--force`로 재실행) |

## 4. 안정성 평가 — 강점/약점 (2026-05-28 8.7분 크롤 기반)

### 강점

| ✅ | 항목 |
|---|---|
| | 7,335 엔트리 / 8.7분 / **에러 0건** |
| | 12개 sgType × 17 시·도 × 226 자치단체 루프 무결성 |
| | 시·도 권역 동적 fetch (전남광주통합특별시 등 신권역 자동 반영) |
| | sgTypecode 매핑 단일 소스 (`OFFICE_PROFILES` 한 곳) — 재발견 시 1군데만 수정 |
| | 직책별 차별화 자동화 (`isFlagApplicable` → 분모 직책별) |
| | 정당명부 합성키 (`pty:{sgType}:{sggId}:{jdId}`) 중복 0건 |

### 약점·잔여 위험

| ⚠️ | 위험 | 영향 | 보완 |
|---|---|---|---|
| W1 | NEC 사이트 개편 시 정규식·엔드포인트 깨짐 | 즉시 0건 응답 | 통합 테스트 1개 추가 (종로 후보 N명 인덱싱 후 결과 비교) |
| W2 | 단일 JSESSIONID 장기 사용 | 1시간+ 작업 시 세션 만료 가능 | B4 세션 갱신 helper |
| W3 | 02-detail 정규식 fragile (info.nec HTML 변경) | huboid별 빈 결과 | B5 graceful skip + needsReview 마크 |
| W4 | 5대공약 없는 후보(A5·A7) 처리 누락 가능성 | 03 호출 시 빈 응답 → 빈 파일 저장 | B2에서 직책별 분기 |
| W5 | 체크리스트 갱신기가 파일 존재만 확인 | 빈/손상 파일도 collected=true | 07 보강 — 필수 필드 존재 검증 |
| W6 | peti 자동화 불가 (manual cookie 주입) | 수동 운영 필요 | 운영자 워크플로 문서 + 분기별 1회 권장 |
| W7 | 1차 인덱싱 재실행 시 idempotent X | 매번 전체 재크롤 (~9분) | 변경된 시·도/sgType만 재크롤 옵션 |

### 진짜 깨질 우려 — 시나리오 3개

**S1. NEC가 sgTypecode 매핑을 또 바꿈** (정치인 입후보 정정 등으로 신권역 추가 시):
- 감지: 매일 새벽 `initUCACommimentRegion.do` 호출 후 응답 권역 수가 16과 다르면 알림.
- 대응: `OFFICE_PROFILES` + `FALLBACK_SIDO` 동기 수정 PR.

**S2. info.nec HTML 구조 변경** (15필드 정형 추출 실패):
- 감지: 02-detail.ts에 필수 필드 (name·birthDate) 추출 실패 시 throw.
- 대응: 정규식 패치 PR.

**S3. peti 세션 만료** (재산 detail 수집 중단):
- 감지: peti 호출 응답에 "비정상적 접근" 또는 redirect.
- 대응: 운영자가 브라우저 세션 갱신 후 환경변수 재주입.

## 5. 결론 — 가동 가능 상태?

| 항목 | 상태 |
|---|---|
| 1차 명부 인덱싱 (전국 7,335) | ✅ **가동 가능** |
| 02·03·06 단건 수집 (huboid 1명) | ✅ **가동 가능** (#13에서 검증) |
| 일괄 보강 02 (개인 6,712명) | ✅ **가동 가능** (`run-batch-detail.ts`, idempotent + 필수 필드 가드) |
| 일괄 보강 03 (공약 의무 직책 1,902명) | ✅ **가동 가능** (`run-batch-promise.ts`, 직책별 자동 skip) |
| 일괄 보강 06 (wikidata) | ✅ **가동 가능** (`run-batch-wikidata.ts`, 가드레일 + nodetail skip) |
| 체크리스트 자동 갱신 | ✅ **가동 가능** (직책별 분모 자동) |
| UI 분기 (R1~R5) | ⚠️ 도메인 타입은 준비, **UI 구현 별도** |

### 즉시 가동 가능 워크플로

```bash
# 1. 명부 인덱싱
pnpm tsx scripts/ingest/01b-fetch-national-roster.ts

# 2. 단건 보강 (필요한 후보 huboid 골라 수동 호출)
pnpm tsx scripts/ingest/02-parse-detail-html.ts $HUBOID > data/curated/${HUBOID}_detail.json

# 3. 체크리스트 동기화
pnpm tsx scripts/ingest/07-update-checklist.ts
```

### 전국 일괄 가동 전 필요한 작업

1. **B1 `run-batch-detail.ts`** — 핵심. roster 순회 + 세션 재발급 + idempotent + rate limit.
2. **B4 세션 갱신 helper** — `_common.ts`에 1줄 추가.
3. **B6 02 idempotent 옵션** — 기존 파일 있으면 skip.

### 결정 로그

| ID | 결정 | 일자 |
|---|---|---|
| A1~A7 | 7개 직책 차별화 매트릭스 채택 | 2026-05-28 |
| R1~R5 | 5개 UI 분기 규칙 채택 | 2026-05-28 |
| S2 | info.nec HTML 변경 시 throw 정책 | 2026-05-28 |
| W2/B4 | 세션 재발급 helper 추가 (구현 대기) | 2026-05-28 |
