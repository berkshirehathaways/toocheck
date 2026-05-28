# [#13] 실데이터 수집 파이프라인 — 소스 매핑 & 갭 트래커

## 목적
mock 시드(#2)를 실제 후보 데이터로 교체하기 위한 **소스 → 필드 매핑 표**와 수집 워크플로우를 정의한다. 본 이슈는 단일 PR 단위가 아니라 **수집 진행 상황을 누적 추적**하는 살아있는 문서다.

> 참조: PRD §8, #2(시드), #11(API)
>
> 본 문서는 2026-05-28 openchrome 1회 풀 사이클 시도 결과를 토대로 작성됨. 시도 요약은 본문 §6 참고.

## 핵심 결정 사항 (수집 시작 전 확정)

- [ ] **타깃 선거구 범위** — 전국 / 광역 17 / 운영자 거주 1곳 (#0 결정 의존)
- [ ] **데이터 저장소** — `data/curated/*.json` 파일 / SQLite / Supabase
- [ ] **갱신 주기** — 1회 동결 / 정정 요청 시 / 주 1회 cron
- [ ] **PDF 파싱 도구** — `pdf-parse` (텍스트만) / `pdfjs-dist` (레이아웃 보존) / OCR(`tesseract.js`) 폴백
- [ ] **사진 처리** — placeholder 유지 (PRD C7) / NEC PDF에서 추출 후 호스팅 (초상권 검토 필요)
- [ ] **공약 카테고리 부여 방식** — 키워드 사전 1차 + 운영자 검수 vs 전수 수동

---

## 1. 소스 사이트 우선순위 (실측 기준)

> ⚠️ 이전 권장사항 정정: 원래 `info.nec.go.kr`을 1순위로 봤으나, 2026-05-28 openchrome 시도에서 **`policy.nec.go.kr`이 후보자 공약 + 정보공개 PDF 단일 게이트웨이**임이 확인됨. `info.nec.go.kr`은 통계 전용으로 한 단계 후순위.

| 순위 | 사이트 | URL | 역할 | 자동화 적합도 |
|---|---|---|---|---|
| ⭐⭐⭐ | **NEC 정책공약마당** | `policy.nec.go.kr` | 공약 PDF + 정보공개 PDF + 선거공보 PDF — **단일 진입점** | △ (UI 비표준, PDF 다운 우회 필요) |
| ⭐⭐⭐ | **NEC 선거통계시스템** | `info.nec.go.kr` | 선거 일정·후보자 등록 통계·당선/사퇴 상태 | ○ |
| ⭐⭐ | **공공데이터포털 OpenAPI** | `data.go.kr` (검색: "중앙선거관리위원회") | 위 데이터 일부의 정형 JSON | ◎ (가장 좋음, 키 신청 필요) |
| ⭐⭐ | **선거공보 PDF (NEC 호스팅)** | `policy.nec.go.kr` PDF 링크 | 후보 본인 작성 공약 원문·자기소개·자기 PR | △ (PDF 파싱) |
| ⭐⭐ | **공직자윤리위원회 재산공개** | `peti.go.kr` (재산변동신고) | 재산 교차검증 (현직 공직자에 한함) | ○ |
| ⭐ | **한국매니페스토실천본부** | `manifesto.or.kr` | 공약 카테고리·이행률·평가 | △ |
| ⭐ | **SNU 팩트체크 / 뉴스타파** | `factcheck.snu.ac.kr`, `newstapa.org` | CrossCheck 보조 자료 | △ (수동) |
| ⭐ | **후보자 SNS·홈페이지** | 각자 | 공약 상세 본문·자기소개 | × (수동) |
| ⭐ | **법원 판결문 열람** | `scourt.go.kr` | 전과 교차검증 (한계 있음) | × |

---

## 2. 사이트별 수집 가능 데이터 매핑

### 2-1. `policy.nec.go.kr` (정책공약마당) ⭐⭐⭐

**핵심 식별자** (재현 가능):
```
sgId=420260603       # 2026-06-03 지방선거
sgTypecode=4         # 구·시·군의 장 (1=시도지사 / 3=시도의원 / 5=구시군의원 / 9=교육감)
regionId=1100        # 서울특별시 (부산=2600, 대구=2700 ...)
sggId=???            # 선거구 (예: 종로구) — 미확보, 다음 세션에서 확보 필요
```

**확인된 API 엔드포인트**:
| URL | 메서드 | 응답 |
|---|---|---|
| `/plc/commiment/initUCACommiment.do?menuId=CNDDT25` | GET | 후보자공약 검색 게이트웨이 (HTML) |
| `/plc/commiment/initUCACommimentRegion.do` | POST (`sgId, sgTypecode, regionId`) | 시도/구 리스트 (JSON, 모달 주입) |
| `/plc/commiment/UELPromisePopup.do` | POST (`frmPromiseView`) | 공약 PDF 팝업 (target=_blank) |
| `frmpdf` form (action 동적) | POST | 정보공개·선거공보 PDF 다운 |

**채울 수 있는 필드**:

| 엔티티 | 필드 | 출처 |
|---|---|---|
| `Election` | `id`, `name`, `electionType`, `electionDate`, `sourceUrl` | 페이지 본문 (`제9회 전국동시지방선거`, sgId=420260603) |
| `District` | `name`, `region`, `positionTitle` | initUCACommimentRegion 응답 (sggId 기반) |
| `Candidate` | `ballotNumber`, `name`, `party`, `status` | 후보 검색 결과 카드 |
| `Candidate` | `birthYear` | 정보공개 PDF (생년월일 명시) |
| `CandidateDisclosure.assetTotal` | 재산 총액 (천원→원 환산) | 정보공개 PDF "재산신고" 페이지 |
| `CandidateDisclosure.assetBreakdown` | 부동산/예금/증권/기타 % | 정보공개 PDF |
| `CandidateDisclosure.criminalRecords[]` | year, law, outcome, amountKrw | 정보공개 PDF "전과기록" 페이지 |
| `CandidateDisclosure.taxArrears[]` | year, amountKrw, status | 정보공개 PDF "납세실적 및 체납" 페이지 |
| `CandidateDisclosure.militaryRecord` | 원문 raw text | 정보공개 PDF "병역사항" 페이지 |
| `CandidateDisclosure.sourcePublishedAt` | 등록 마감 후 NEC 공개일 | PDF 푸터 |
| `CandidatePromise.title`, `body` | 5대 공약 항목별 | 공약 PDF "5대 공약" 섹션 |
| `CandidatePromise.sourceUrl` | NEC가 호스팅하는 PDF URL | UELPromisePopup 응답 URL |

**제약 / 미확보**:
- 정보공개 PDF는 OCR 친화 PDF로 제공되긴 하지만, 표(table) 구조가 깨지는 케이스가 있음 — `assetBreakdown` 같은 분리 항목은 **레이아웃 보존 파싱(`pdfjs-dist`)** 필요
- 후보 사진은 PDF에 임베드된 1장만 제공 → 따로 추출 후 호스팅 결정 필요
- `policy.nec.go.kr` 자체는 후보 **CSV/XML 일괄 다운로드를 제공하지 않음** → 선거구 단위 순회 스크립트 필요

---

### 2-2. `info.nec.go.kr` (선거통계시스템) ⭐⭐⭐

**역할**: 후보자 등록 통계, 선거 일정·선거구 메타, 당선/사퇴/등록무효 상태

**채울 수 있는 필드**:

| 엔티티 | 필드 | 출처 메뉴 |
|---|---|---|
| `Election` | `electionDate`, `status` | 최근선거/역대선거 메뉴 |
| `District` | 선거구 코드 매핑 | 선거구 → 후보자 명부 진입 시 |
| `Candidate.status` | `withdrawn`, `unknown` 판정 | "사퇴/사망/등록무효" 메뉴 |
| 후보자 등록수 | 통계 표시용 (스키마 외) | "후보자 통계" 메뉴 |

**제약**:
- 개별 후보 등록정보(재산/전과/체납/병역)은 **여기서 제공하지 않음** → 모두 `policy.nec.go.kr`로 위임
- 페이지가 iframe 기반 + 통계용 jsp → 자동화 시 `info.nec.go.kr/electioninfo/...` 패턴 직링크 확보 후 사용

---

### 2-3. 공공데이터포털 OpenAPI ⭐⭐⭐ (자동화 1순위)

**URL**: `data.go.kr` → 검색 "중앙선거관리위원회"

**제공되는 API (확인 필요, 신청 후 확정)**:
- `getEnsmInfoApi` 류: 선거 정보
- `getPofelcddInfoApi` 류: 후보자 정보
- `getCdInfoApiV2` 류: 등록정보 (재산·전과·세금)
- 공약: **OpenAPI로 제공 안 됨** → PDF 파싱이 유일

**채울 수 있는 필드**: 위 `policy.nec.go.kr` 1·2번(메타) + 일부 3·4번 항목. **자동화 ROI 최대**.

**선행 조건**:
- [ ] OpenAPI 키 신청 (1~3일 소요)
- [ ] 일일 호출 한도 확인 (개발 1000회/일 정도)
- [ ] 응답 스키마 확인 후 우리 도메인 타입과 매핑 헬퍼 작성 (`lib/ingest/nec-api-adapter.ts`)

---

### 2-4. 선거공보 PDF (NEC 호스팅) ⭐⭐

> NEC 안내: "선거공보 파일은 5. 26.(화) 부터 공개될 예정" — 오늘(2026-05-28) 기준 공개 시작 2일차.

**채울 수 있는 필드**:

| 엔티티 | 필드 | 출처 |
|---|---|---|
| `CandidatePromise.body` (상세 본문) | 5대 공약을 넘어선 추가 공약 본문 | 공보 4~16쪽 |
| `CandidatePromise.specificityScore` 입력 자료 | 예산·기간·주체·지표 명시 여부 | 공보 본문 |
| `Candidate` 보조 정보 | 자기소개·경력 (스키마 외 데이터) | 공보 1~2쪽 |

**제약**:
- 공보는 후보 본인이 디자인 → 레이아웃 자유도 ↑ → **자동 추출 정확도 낮음** (수동 검수 필수)
- 일부 후보는 공보 제출 자체를 안 함 → "비활성화된 아이콘"으로 표시됨 (NEC 안내)

---

### 2-5. 공직자윤리위원회 재산공개 ⭐⭐

**URL**: `peti.go.kr` (공직자 재산변동신고)

**채울 수 있는 필드**:
- `CandidateDisclosure.assetTotal` **교차검증** — 후보가 현직 공직자(국회의원, 단체장 등)인 경우 매년 신고된 재산변동 자료와 NEC 자료 비교 가능
- 불일치 시 운영자 cross-check 트리거 (D1 결정에 따라 `crossCheckText` 추가)

**제약**:
- 신규 출마 후보(공직자가 아니었던 경우)는 자료 없음
- 신고 시점 차이(`peti.go.kr`은 매년 3월, NEC는 후보등록 마감일 기준) → 단순 일치 비교 불가, 추세 비교만

---

### 2-6. 한국매니페스토실천본부 ⭐

**URL**: `manifesto.or.kr`

**채울 수 있는 필드**:
- `CandidatePromise.category` 분류 참고 (우리 9분류와 매핑)
- 과거 공약 이행률 자료 (현직자 재선 출마 시 의미 있음)

**제약**:
- 평가 데이터는 사이트 라이선스 검토 필요 (재배포 가능 여부)
- 우리 스키마 직접 채움보다는 운영자의 `crossCheckText` 작성에 참고

---

### 2-7. 언론 사실확인 ⭐

| 사이트 | URL | 용도 |
|---|---|---|
| SNU 팩트체크 | `factcheck.snu.ac.kr` | 후보 발언·공약 사실관계 검증 자료 |
| 뉴스타파 | `newstapa.org` | 전과·재산 심층 보도 |
| KBS·MBC 사실관계 | 각사 팩트체크 코너 | 보조 |

**채울 수 있는 필드**:
- `CandidateCheckCard.body` 작성 시 인용 가능 (단, **단정적 표현 금지** — PRD §11)
- `CrossCheckText` 운영자 작성 시 참고

**주의**: §17 금지어 검사 통과 필수. 언론 본문을 그대로 인용하면 금지어 포함 가능성 ↑.

---

### 2-8. 후보자 SNS·홈페이지 ⭐

**용도**: 공약 본문·자기소개 보강 (NEC PDF 누락 시)

**주의**:
- 비공식 자료 → `CandidatePromise.source` 는 `manual` 로 표기
- 운영자 검수 필수
- 캠프 사이트가 선거 후 사라지는 경우 많음 → `sourceUrl` 보다는 **screenshot 또는 archive.org 사본 보관 권장**

---

## 3. 스키마 필드 × 소스 매트릭스 (한눈에)

| 필드 | 1순위 소스 | 2순위 / 보강 | 자동화 가능 |
|---|---|---|---|
| `Election.*` | OpenAPI | policy.nec / info.nec 페이지 | ◎ |
| `District.*` | OpenAPI | policy.nec `initUCACommimentRegion.do` | ◎ |
| `Candidate.ballotNumber, name, party` | OpenAPI | policy.nec 검색 결과 | ◎ |
| `Candidate.birthYear` | 정보공개 PDF | OpenAPI (일부) | △ |
| `Candidate.status` | info.nec "사퇴/사망/등록무효" | OpenAPI | ○ |
| `Disclosure.assetTotal` | 정보공개 PDF | OpenAPI (일부) | △ (PDF 파싱) |
| `Disclosure.assetBreakdown` | 정보공개 PDF | — | ⚠️ 표 파싱 정확도 |
| `Disclosure.criminalRecords[]` | 정보공개 PDF | 법원 판결문 (교차) | △ |
| `Disclosure.taxArrears[]` | 정보공개 PDF | — | △ |
| `Disclosure.militaryRecord` | 정보공개 PDF (원문) | — | △ |
| `Disclosure.sourceUrls` | NEC PDF URL | — | ◎ |
| `Disclosure.sourcePublishedAt` | NEC 등록 마감일 + 공개일 | — | ◎ |
| `Disclosure.sourceCheckedAt` | 운영자 수집 시각 (KST) | — | ◎ 자동 |
| `Promise.title, body` | 공약 PDF (5대 공약) | 선거공보 PDF (추가) / SNS (보조) | △ |
| `Promise.category` | **운영자 수동** + 키워드 사전 1차 | manifesto.or.kr 참고 | ✗ |
| `Promise.specificityScore` | **운영자 수동** (5요소 체크리스트) | — | ✗ |
| `Promise.source` | 매핑 규칙 (NEC=`nec_policy` / 공보=`candidate_booklet` / SNS=`manual`) | — | ◎ |
| `Promise.crossCheckText?` | **운영자 수동** | 매니페스토·언론 참고 | ✗ |
| `CheckCard.*` | **운영자 생성** (자동 룰 기반 1차) | — | △ |

**범례**: ◎ 완전자동 / ○ 자동 가능 / △ 자동 가능하나 검수 필수 / ✗ 운영자 작업 / ⚠️ 정확도 낮음

---

## 4. 스키마 보강 제안 (수집 후 발견)

수집 시도에서 발견된 스키마 미스매치:

1. **`CandidateDisclosure.sourceUrls: string[]`** → **객체 분리 권장**
   ```ts
   sourceUrls: {
     profile: string;          // info.nec 후보 페이지
     disclosure: string;       // 정보공개 PDF
     promiseBooklet?: string;  // 선거공보 PDF
   }
   ```
   사유: NEC가 자료를 별도 PDF로 제공하므로 배열보다 명시 키가 정정 추적 용이.

2. **`CandidatePromise.sourceFileName?: string`** 추가
   사유: 공약 PDF의 파일명·해시를 보관해두면 정정 요청 시 "어느 버전의 자료에 기반한 항목인지" 추적 가능.

3. **`Candidate.candidateNecId?: string`** 추가
   사유: NEC 내부 식별자(`sggId × ballotNumber × name` 조합) 보관 → 재수집/업데이트 시 매칭 키.

4. **선거구 코드 표준화 필요**
   사유: NEC의 `regionId`(1100) / `sggId`(미확보) 와 우리 도메인의 `District.id`(`district_*`) 매핑 테이블 필요.

---

## 5. 산출물 (수집 파이프라인 PR 단위)

```
scripts/ingest/
├── 01-fetch-elections.ts          # OpenAPI 또는 info.nec → data/raw/elections/
├── 02-fetch-districts.ts          # 시도×선거종류 순회 → data/raw/districts/
├── 03-fetch-candidates.ts         # 선거구 단위 후보 리스트 → data/raw/candidates/
├── 04-download-pdfs.ts            # 정보공개·공보·공약 PDF 일괄 다운 → data/raw/pdfs/{candidateId}/
├── 05-parse-disclosure.ts         # PDF → JSON (재산·전과·체납·병역)
├── 06-parse-promises.ts           # PDF → JSON (공약)
└── 07-build-seed.ts               # 검수 완료 데이터를 mocks/seed.ts 형식으로 변환

data/
├── raw/                           # 원본 (PDF, JSON 응답 전부)
├── normalized/                    # 우리 타입 형식으로 변환했으나 미검수
└── curated/                       # 운영자 검수 + reviewStatus=reviewed

lib/ingest/
├── nec-api-adapter.ts
├── pdf-extractors/
│   ├── disclosure-asset.ts
│   ├── disclosure-criminal.ts
│   ├── disclosure-tax.ts
│   ├── disclosure-military.ts
│   └── promise.ts
└── category-classifier.ts         # 키워드 사전 기반 1차 분류
```

---

## 6. 2026-05-28 풀 사이클 시도 결과

**진행 단계**: 풀 사이클 미완료. 후보 1명도 수집 못 함.

| 단계 | 결과 |
|---|---|
| `info.nec.go.kr` 진입 | ✅ |
| 사이트 분업 구조 파악 (info=통계 / policy=공약·정보공개) | ✅ |
| `policy.nec.go.kr` 후보자공약 페이지 진입 | ✅ |
| 선거 종류 선택 (구·시·군의 장) | ✅ — `sgTypecode=4`, `sgId=420260603` 확보 |
| 시도 선택 (서울특별시) | ⚠️ — `regionId=1100` 확보됐으나 모달 빈 상태 |
| 구 선거구 선택 (종로구) | ❌ — `sggId` 미확보. 모달 콘텐츠 주입 실패 |
| 후보 리스트 조회 | ❌ |
| 후보 1명 정보공개 PDF 다운 | ❌ |
| PDF 파싱 → 필드 매핑 | ❌ |

**원인**: `policy.nec.go.kr`의 hidden-modal 패턴. AJAX(`initUCACommimentRegion.do`)는 200 OK 반환하지만 응답이 모달에 주입 안 됨. openchrome `javascript_tool` 의 fetch가 Promise unwrap 실패하여 응답 본문 직접 확인도 불가.

**우회 방안 (다음 시도)**:
- (A) **curl 직접 호출** — 세션 쿠키 없이 POST 시도 → 동작하면 가장 빠름
- (B) Playwright 별도 스크립트로 `network` listener 사용
- (C) OpenAPI 신청 후 우회 (가장 안정)

---

## 수용 기준 (본 이슈는 누적 추적용 — 단일 PR 아님)

- [ ] §1 소스 우선순위가 운영자 결정에 부합하도록 갱신
- [ ] §2 사이트별 매핑이 신규 발견 시 PR로 보강
- [ ] §3 매트릭스의 "자동화 가능" 컬럼이 실측 결과로 갱신
- [ ] §4 스키마 보강안에 대한 운영자 결정 기록
- [ ] §5 산출물 디렉토리 구조가 실제 코드와 일치
- [ ] §6 진행 단계 체크리스트가 매 시도 후 갱신

## 의존
- #2 (도메인 타입 — §4 보강 반영 시)
- #11 (Mock API — loader 시그니처 유지 필요)
- #0 G계열 결정 (수집 정책 관련)

## Out of scope
- 정정 요청 워크플로우 (#10)
- 실시간 갱신 (cron / webhook) — 별도 후속 이슈
- 운영자 검수 어드민 UI — 별도 후속 이슈
- 후보 사진 호스팅 인프라 (CDN·초상권 검토 등)

## 🚨 사람 결정 필요

- [ ] **공약 카테고리 9분류** 운영자 키워드 사전 확정 (PRD §11 3개 + 확장 5개 + 운영자 추가)
- [ ] **PDF 파싱 도구 선택** — `pdf-parse` / `pdfjs-dist` / OCR
- [ ] **후보 사진** — placeholder 유지 vs NEC PDF 추출 후 자체 호스팅 (초상권 자문 필요)
- [ ] **자료 갱신 주기** — 1회 동결 / 정정 시 즉시 / 정기
- [ ] **데이터 저장소** — JSON 파일 / SQLite / Supabase
- [ ] **OpenAPI 키 신청 명의** — 운영자 개인 / 팀 명의 (A2 결정 의존)
- [ ] **언론 자료 인용 방침** — 직접 인용 가능 / 운영자 요약만 허용 (저작권·금지어 양면)
