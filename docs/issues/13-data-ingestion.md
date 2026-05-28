# [#13] 실데이터 수집 파이프라인 — 소스 매핑 & 갭 트래커

## 목적
mock 시드(#2)를 실제 후보 데이터로 교체하기 위한 **소스 → 필드 매핑 표**와 수집 워크플로우를 정의한다. 본 이슈는 단일 PR 단위가 아니라 **수집 진행 상황을 누적 추적**하는 살아있는 문서다.

> 참조: PRD §8, #2(시드), #11(API)
>
> 본 문서는 2026-05-28 openchrome 1회 풀 사이클 시도 결과를 토대로 작성됨. 시도 요약은 본문 §6 참고.

## 핵심 결정 사항 (수집 시작 전 확정)

- [x] **타깃 선거구 범위** — **전국** (2026-05-28 결정)
  - 광역단체장 17 + 기초단체장 226 + 광역의원·기초의원·교육감 포함
  - 후보 총량 추정: 4,500~5,500명 → 정보공개 PDF 동일 수량 + 공약 PDF 동일 수량
  - 시행 순서는 §7 단계별 롤아웃 참고 (기초단체장부터 시작 권장)
- [ ] **데이터 저장소** — `data/curated/*.json` 파일 / SQLite / Supabase
- [ ] **갱신 주기** — 1회 동결 / 정정 요청 시 / 주 1회 cron
- [x] ~~**PDF 파싱 도구 — `pdfjs-dist`**~~ (2026-05-28 결정, **즉일 정정**)
  - **정정 사유 (2026-05-28 검증 사이클)**: NEC 후보 등록서류가 PDF가 아니라 **TIF 스캔 이미지**임을 실측 확인.
  - 새 방향: **요약 정형 데이터(HTML)** 가 핵심 필드 90%를 커버 → OCR은 보조용
    - HTML 파서: `cheerio` (정형 데이터, 자동화 ◎)
    - OCR (`assetBreakdown` % 등 보조 필드 전용): `tesseract.js` / Naver Clova OCR / Google Vision 중 비교 후 선정
  - 선거공보·5대공약은 실제 PDF지만 file gate(synapViewer/frmpdf)가 막혀 미해결 → §8 우회 전략 참조
- [ ] **사진 처리** — placeholder 유지 (PRD C7) / NEC PDF에서 추출 후 호스팅 (초상권 검토 필요)
- [ ] **공약 카테고리 부여 방식** — 키워드 사전 1차 + 운영자 검수 vs 전수 수동

---

## 1. 소스 사이트 우선순위 (실측 기준)

> ⚠️ **2회 정정 이력** (2026-05-28 검증 사이클로 확정):
> - 1차 가설: `info.nec.go.kr`이 1순위 → 폐기
> - 2차 가설: `policy.nec.go.kr`이 단일 게이트웨이 → 부분만 사실
> - **3차 확정**: 두 사이트가 **역할 분담** — info.nec = 정형 등록정보(HTML), policy.nec = 후보 리스트 인덱싱 + 공약 PDF

| 순위 | 사이트 | URL | 역할 | 자동화 적합도 |
|---|---|---|---|---|
| ⭐⭐⭐ | **NEC 선거통계시스템 (후보자 정보공개)** | `info.nec.go.kr/electioninfo/candidate_detail_info.xhtml` | **정형 등록정보 HTML** — 재산 총액·전과·체납·병역·학력·경력 (요약) | ◎ HTML 파싱 |
| ⭐⭐⭐ | **NEC 정책공약마당 (후보 인덱싱)** | `policy.nec.go.kr/plc/commiment/initUCACommimentList.do` | 선거→시도→구→선거구→후보 인덱싱 + huboid + PDF 경로 | ◎ JSON API |
| ⭐⭐⭐ | **NEC 스캔 등록서류 (TIF)** | `info.nec.go.kr/electioninfo/candidate_detail_scanSearchJson.json` | **상세 등록서류 스캔** (재산 분해 %·전과 detail·체납 detail 등) | △ OCR 필요 + 파일 게이트 우회 |
| ⭐⭐⭐ | **NEC 공약 PDF (5대공약·공보)** | `policy.nec.go.kr/20260603/PDF/*` | 후보 공약 원문 | △ file gate 미해결 |
| ⭐⭐ | **공공데이터포털 OpenAPI** | `data.go.kr` (검색: "중앙선거관리위원회") | 위 데이터의 정형 JSON 미러 (있다면) | ◎ (검증 필요) |
| ⭐⭐ | **공직자윤리위원회 재산공개** | `peti.go.kr` (재산변동신고) | 재산 교차검증 (현직 공직자에 한함) | ○ |
| ⭐⭐ | **국세청 고액·상습 체납자 명단** | `nts.go.kr` (연 1회 11월 공개) | 체납 교차검증 (한계: 일부 후보만) | × 수동 |
| ⭐ | **NEC CDN (후보 사진)** | `cdn.nec.go.kr/photo_20260603/...` | 후보 본인 사진 (무인증 공개) | ◎ |
| ⭐ | **한국매니페스토실천본부** | `manifesto.or.kr` | 공약 카테고리·이행률·평가 | △ |
| ⭐ | **SNU 팩트체크 / 뉴스타파** | `factcheck.snu.ac.kr`, `newstapa.org` | CrossCheck 보조 자료 | △ (수동) |
| ⭐ | **후보자 SNS·홈페이지** | 각자 | 공약 상세 본문·자기소개 | × (수동) |
| ⭐ | **법원 판결문 열람** | `scourt.go.kr` | 전과 교차검증 (한계 있음) | × |

### 1-1. 핵심 식별자 매핑 (2026-05-28 실측)

후보 1명 데이터를 인덱싱하기 위한 **6-키 체인**. 전국 수집 스크립트의 인덱싱 기준.

| 우리 도메인 | NEC 키 (policy) | NEC 키 (info) | 예시값 |
|---|---|---|---|
| `Election.id` | `sgId` | `electionId` (앞에 `00` 패딩) | policy=`20260603`, info=`0020260603` |
| `Election.subType` | `subSgId` / `sgTypecode` | — | `420260603` / `4` (구·시·군의 장) |
| `District.region` (광역) | `wiwsidocode` | — | `1100` (서울특별시) |
| `District.gu` | `wiwid` | — | `1101` (종로구) |
| `District.sggId` | `sggid` | — | `4110100` (종로구청장 선거구) |
| `Candidate.necId` | `huboid` | `huboId` | `100154016` (유찬종) |

**electionId 패딩 패턴**: policy.nec는 `20260603`, info.nec는 `0020260603` (앞에 `00`). 어댑터 함수에서 변환 필요.

---

## 2. 사이트별 수집 가능 데이터 매핑

### 2-1. `info.nec.go.kr` (선거통계시스템) — 정형 등록정보 ⭐⭐⭐ **1순위**

**핵심 엔드포인트** (2026-05-28 실측 검증):
| URL | 메서드 | 응답 |
|---|---|---|
| `/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId={huboid}` | GET | **후보자 정보공개 팝업 (HTML)** — 핵심 데이터 페이지 |
| `/electioninfo/candidate_detail_scanSearchJson.json?gubun=N&electionId=...&huboId=...&statementId=CPRI03_candidate_scanSearch` | GET (XHR) | gubun별 스캔 TIF 경로 (gubun: 1=학력, 2=재산, 3=납세, 4=병역, 5=전과, 8=공직경력) |

**candidate_detail_info.xhtml 한 페이지로 채워지는 필드 (실측)**:

| 우리 스키마 필드 | HTML 라벨 | 유찬종 예시값 |
|---|---|---|
| `Candidate.name` | 성명 | 유찬종 |
| `Candidate.nameHanja` (스키마 보강) | 성명 한자 | 劉燦鍾 |
| `Candidate.birthYear` (+월일까지) | 생년월일 | 1959.11.20 (66세) / 남 |
| `Candidate.address` (스키마 보강·privacy 검토) | 주소 | 서울특별시 종로구 지봉로 |
| `Candidate.occupation` (스키마 보강) | 직업 | 정당인 |
| `Candidate.education` (스키마 보강) | 학력 | 연세대학교 경법대학 법학 졸업 |
| `Candidate.career[]` (스키마 보강) | 경력 | (전)종로구청장 후보 / (전)이재명 대통령후보 종로구 공동상임 선대위원장 |
| `Disclosure.assetTotal` | 재산신고액(천원) | 4,060,212 → 4,060,212,000원 |
| `Disclosure.militaryRecord` | 병역신고사항(본인) | "군복무를 마친사람" |
| `Disclosure.fiveYearTaxPaid` (스키마 보강) | 납부액(천원) | 848,620 → 8.49억원 |
| `Disclosure.fiveYearTaxArrears` (스키마 보강) | 최근 5년간 체납액(천원) | 0 |
| `Disclosure.currentTaxArrears` | 현체납액(천원) | 0 |
| `Disclosure.criminalRecords[]` | 전과기록유무(건수) | 없음 → `[]` |
| `Candidate.electionRunCount` (스키마 보강) | 입후보 횟수 | 5회 |

→ **이 한 페이지가 후보 1명 데이터의 약 90%를 자동 추출 가능하게 함.** 자동화 핵심.

**미커버 필드 (TIF 스캔으로만 가능)**:
- `Disclosure.assetBreakdown` (부동산/예금/증권/기타 %) — gubun=2 TIF
- 전과 detail (year/law/outcome) — gubun=5 TIF
- 체납 detail (year/amount/status) — gubun=3 TIF
- 병역 detail (복무기간/계급) — gubun=4 TIF
- 학력 상세 사본 / 경력 상세 사본 — gubun=1, 8 TIF

---

### 2-2. `policy.nec.go.kr` (정책공약마당) — 후보 인덱싱 + 공약 ⭐⭐⭐

**확인된 API 엔드포인트 (2026-05-28 실측 검증)**:

| URL | 메서드 | body 필수 | 응답 |
|---|---|---|---|
| `/plc/commiment/initUCACommiment.do?menuId=CNDDT25` | GET | — | 후보자공약 검색 게이트웨이 (세션 쿠키 발급용) |
| `/plc/commiment/initUCACommimentRegion.do;jsessionid=...` | POST | `sgId, subSgId` | 시도 리스트 JSON (`regionlist[].wiwid/wiwname`) |
| `/plc/commiment/initUCACommimentGu.do;jsessionid=...` | POST | `sgId, subSgId, wiwsidocode, sortYn` | 구 리스트 JSON (`gulist[].wiwid/wiwname`) |
| `/plc/commiment/initUCACommimentSgg.do;jsessionid=...` | POST | `sgId, subSgId, wiwsidocode, wiwid, sortYn` | 선거구 리스트 JSON (`sgglist[].sggid/sggname`) |
| `/plc/commiment/initUCACommimentList.do;jsessionid=...` | POST | `sgId, subSgId, hRegionId, hGuId, hSggId, sgTypecode, pageIndex, elecEndYn=N` | **후보 리스트 + PDF 경로** (`list[].huboid/hbjname/hbjgiho/jdname/fileinfo`) |
| `/plc/commiment/UELPromisePopup.do` | POST | `ocrCnvrSeqNo` (어디서 오는지 추가 조사 필요) | 공약 본문 (OCR 변환 텍스트) ← **자동화 가능성 ↑** |

**`list[].fileinfo` 파싱 규칙** (실측):
```
"선거공보||20260603/PDF/PBINFO/1101/003_100154016_20260523_1.pdf||||1||HEIGHT||Y||00||01,
선거공약서||||||0||HEIGHT||Y||||00,
5대공약||20260603/PDF/P5_PRMS_PUB/1101/001_100154016_20260516_1.pdf||11610||1||HEIGHT||Y||00||01"
```
- 각 항목은 `,` 구분 / 필드는 `||` 구분
- 0번 필드: 자료 종류 (`선거공보`/`선거공약서`/`5대공약`)
- 1번 필드: PDF 경로 (없으면 미제출)
- 비어있으면 후보가 해당 자료를 제출하지 않음 → `CandidatePromise.source` 분기에 활용

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

### 2-3. `info.nec.go.kr` 통계 영역 (선거 일정·상태) ⭐⭐

§2-1과 동일 호스트지만 별도 메뉴군. 후보 등록정보가 아닌 **선거 메타 / 통계** 용도.

**채울 수 있는 필드**:

| 엔티티 | 필드 | 출처 메뉴 |
|---|---|---|
| `Election` | `electionDate`, `status` | 최근선거/역대선거 |
| `Candidate.status` | `withdrawn`, `unknown` 판정 | "사퇴/사망/등록무효" 메뉴 |
| 후보자 등록수 | 통계 (스키마 외) | "후보자 통계" |

자동화 가치는 낮음 — 선거 시점에 1회 cron으로 갱신만으로 충분.

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

## 3. 스키마 필드 × 소스 매트릭스 (2026-05-28 실측 갱신)

| 필드 | 1순위 소스 | 2순위 / 보강 | 자동화 가능 (실측) |
|---|---|---|---|
| `Election.id` | policy.nec sgId | — | ◎ 검증됨 |
| `Election.electionType`, `electionDate` | policy.nec subSgId/sgTypecode | NEC 공식 일정 | ◎ |
| `District.region/gu/sggId` | policy.nec 4단계 API 체인 | — | ◎ 검증됨 |
| `District.name/positionTitle` | initUCACommimentSgg sggname / sgTypecode 매핑 | — | ◎ |
| `Candidate.ballotNumber/name/party` | policy.nec `initUCACommimentList` | — | ◎ 검증됨 |
| `Candidate.necId` (huboid) | policy.nec `initUCACommimentList` | — | ◎ 검증됨 |
| `Candidate.birthYear` (월일까지) | info.nec `candidate_detail_info.xhtml` | — | ◎ 검증됨 |
| `Candidate.nameHanja` 🆕 | info.nec `candidate_detail_info.xhtml` | — | ◎ 검증됨 |
| `Candidate.occupation` 🆕 | info.nec `candidate_detail_info.xhtml` | — | ◎ 검증됨 |
| `Candidate.education` 🆕 | info.nec `candidate_detail_info.xhtml` | gubun=1 TIF (상세) | ◎ 요약 / △ 상세 |
| `Candidate.career[]` 🆕 | info.nec `candidate_detail_info.xhtml` | gubun=8 TIF (상세) | ◎ 요약 / △ 상세 |
| `Candidate.electionRunCount` 🆕 | info.nec `candidate_detail_info.xhtml` | — | ◎ |
| `Candidate.status` | info.nec 사퇴/사망 메뉴 | — | ○ |
| `Disclosure.assetTotal` | info.nec `candidate_detail_info.xhtml` | — | ◎ 검증됨 |
| `Disclosure.assetBreakdown` | gubun=2 TIF (3장) | **공직자윤리위(`peti.go.kr`) 교차** (현직자만) | ❌ TIF 게이트 + OCR 필요 |
| `Disclosure.criminalRecords[]` | info.nec 요약 ("있음/없음/N건") | gubun=5 TIF (상세) | ◎ 요약 / ❌ 상세 (게이트+OCR) |
| `Disclosure.taxArrears[]` (현·5년) | info.nec 요약 (수치 천원) | gubun=3 TIF (상세) | ◎ 요약 / ❌ 상세 (게이트+OCR) |
| `Disclosure.fiveYearTaxPaid` 🆕 | info.nec `candidate_detail_info.xhtml` | — | ◎ 검증됨 |
| `Disclosure.militaryRecord` | info.nec 요약 (1줄 문구) | gubun=4 TIF (상세) | ◎ 요약 / ❌ 상세 |
| `Disclosure.sourceUrls.profile` | info.nec URL 자체 | — | ◎ |
| `Disclosure.sourceUrls.disclosurePdf` | policy.nec `fileinfo` 파싱 (선거공보) | — | ◎ 경로만 / ❌ 다운 불가 |
| `Disclosure.sourcePublishedAt` | 등록 마감일 추론 | — | ◎ |
| `Disclosure.sourceCheckedAt` | 자동 (수집 시각 KST) | — | ◎ |
| `Disclosure.photoUrl` 🆕 | `cdn.nec.go.kr/photo_20260603/...` | — | ◎ 무인증 공개 |
| `Promise.title, body` | policy.nec `UELPromisePopup.do` (OCR 변환 텍스트) | 5대공약 PDF / 선거공보 PDF | △ ocrCnvrSeqNo 확보 후 |
| `Promise.category` | **운영자 수동** + 키워드 사전 1차 | manifesto.or.kr 참고 | ✗ |
| `Promise.specificityScore` | **운영자 수동** (5요소 체크리스트) | — | ✗ |
| `Promise.source` | 매핑 규칙 (NEC=`nec_policy` 등) | — | ◎ |
| `Promise.crossCheckText?` | **운영자 수동** | 매니페스토·언론 참고 | ✗ |
| `CheckCard.*` | **운영자 생성** (자동 룰 기반 1차) | — | △ |

**범례**: ◎ 완전자동 / ○ 자동 가능 / △ 자동 가능하나 검수·우회 필요 / ✗ 운영자 작업 / ❌ 현재 막힘 (§8 우회 전략 필요)

**🆕 마크 = 2026-05-28 실측에서 새로 발견한 필드, 스키마 보강 필요**

---

## 4. 스키마 보강 제안 (2026-05-28 실측 갱신)

수집 사이클에서 발견된 스키마 미스매치 + 신규 가용 필드:

### 4-1. 기존 필드 구조 수정

1. **`CandidateDisclosure.sourceUrls: string[]`** → **객체 분리**
   ```ts
   sourceUrls: {
     profile: string;          // info.nec candidate_detail_info.xhtml
     disclosurePdfBooklet?: string;  // policy.nec 선거공보 PDF
     promisePdf5?: string;     // policy.nec 5대공약 PDF
     promisePdfBook?: string;  // policy.nec 선거공약서 PDF
   }
   ```

2. **`Candidate.necId: string`** 추가 (필수)
   - NEC 내부 식별자 `huboid` 보관 → 재수집·업데이트 매칭 키
   - 형식: 9자리 숫자 (예: `100154016`)

3. **`District.necKeys: { region, gu, sggId }`** 추가
   - 광역/구/선거구 3단계 NEC 키 보관 → API 호출 키로 활용
   - 우리 `District.id`와 NEC 키의 매핑 유지

### 4-2. 신규 가용 필드 (info.nec 요약 페이지에서 자동 추출 가능)

| 필드 | 타입 | 출처 | 노출 정책 |
|---|---|---|---|
| `Candidate.nameHanja?: string` | 한자 (예: `劉燦鍾`) | info.nec | UI 옵션 (기본 비노출 권장) |
| `Candidate.birthDate: string` | ISO `YYYY-MM-DD` (연월일까지) | info.nec | `birthYear` 보존 + 추가 |
| `Candidate.gender: 'M' \| 'F'` | 성별 | info.nec | 노출 검토 필요 |
| `Candidate.occupation?: string` | 직업 (1줄) | info.nec | 카드 표시 |
| `Candidate.education?: string` | 학력 요약 (1줄) | info.nec | 상세 페이지 |
| `Candidate.career?: string[]` | 경력 (multi-line) | info.nec | 상세 페이지 |
| `Candidate.electionRunCount?: number` | 입후보 횟수 | info.nec | 카드 또는 상세 |
| `Candidate.address?: string` | 주소 (구 단위까지) | info.nec | **privacy 검토 필요** — 노출 결정 보류 |
| `Disclosure.fiveYearTaxPaid: number` | 5년 납부액 (원) | info.nec | 카드 (PRD §9 명시) |
| `Disclosure.fiveYearTaxArrears: number` | 5년 체납액 (원) | info.nec | 카드 (PRD §9 명시) |
| `Disclosure.currentTaxArrears: number` | 현체납액 (원) | info.nec | 카드 (PRD §9 명시) |
| `Disclosure.photoUrl?: string` | NEC CDN URL | cdn.nec.go.kr | **C7 재검토** (placeholder 유지 vs 호스팅) |

### 4-3. 단위 정정

- info.nec의 모든 금액은 **천원 단위** → 우리 도메인의 **원 단위(PRD §12.2)** 로 변환 시 ×1000 필수
- 예: `재산신고액(천원): 4,060,212` → `assetTotal: 4060212000`

### 4-4. 영향 받는 #2 / #11 항목

- `types/domain.ts` — 위 13개 필드 추가 (필수 키는 boolean false 가능성 고려)
- `mocks/seed.ts` — 신규 필드 mock 값 추가
- `lib/api/types.ts` — DTO에도 동일 반영
- `app/(public)/candidates/[id]/page.tsx` — 학력/경력/입후보 횟수 노출 UI 추가
- `lib/format-krw.ts` — 천원 ↔ 원 변환 헬퍼 추가

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

## 6. 검증 사이클 기록

### 6-1. 1차 시도 (2026-05-28 오전, openchrome UI 클릭) — 부분 실패

| 단계 | 결과 |
|---|---|
| `info.nec.go.kr` / `policy.nec.go.kr` 진입 | ✅ |
| 선거 종류 선택 (구·시·군의 장) — `sgTypecode=4` | ✅ |
| 시도 선택 (서울) — `regionId=1100` | ⚠️ 모달 빈 상태 |
| 구 선거구 선택 — `sggId` | ❌ 미확보 |
| **이후 단계 전부 차단** | ❌ |

**원인**: policy.nec UI의 hidden-modal 패턴 (AJAX 응답이 빈 모달에 미주입), openchrome `javascript_tool` Promise unwrap 실패.

### 6-2. 2차 시도 (2026-05-28 오후, curl + openchrome 하이브리드) — **성공**

| 단계 | 결과 |
|---|---|
| 세션 쿠키 발급 (`/plc/commiment/initUCACommiment.do`) | ✅ |
| AJAX 직접 호출 — 시도 리스트 (17개) | ✅ |
| AJAX 직접 호출 — 서울 산하 구 리스트 (25개) | ✅ — 종로구 wiwid=1101 확보 |
| AJAX 직접 호출 — 종로구 선거구 (sggid=4110100) | ✅ |
| AJAX 직접 호출 — 종로구청장 후보 리스트 (2명) | ✅ — 유찬종(huboid=100154016), 정문헌(huboid=100163635) |
| info.nec 후보 상세 페이지 (`candidate_detail_info.xhtml?electionId=0020260603&huboId=100154016`) | ✅ — 정형 데이터 14개 필드 추출 |
| 스캔 파일 경로 JSON 6개 gubun 조회 | ✅ — TIF 경로 10개 확보 |
| TIF 파일 직접 다운로드 | ❌ — 6개 URL 패턴 모두 실패 (404/301→error/405) |
| 선거공보 PDF / 5대공약 PDF 직접 다운로드 | ❌ — 307→`:9343/error.html` 리다이렉트 |
| OCR / pdfjs-dist 파싱 | ❌ — 원본 미확보로 실행 안 함 |

**핵심 추출 데이터 (유찬종)**: 이름, 한자명, 정당, 기호, 생년월일, 주소, 직업, 학력, 경력, 재산신고액(40.6억), 병역(완료), 5년 납세(8.49억), 5년 체납(0), 현체납(0), 전과(없음), 입후보 5회 = **14개 필드**

→ 후보 1명 데이터의 **정형 필드 90% 자동 추출 가능**. TIF/PDF는 file gate 우회 미해결.

### 6-3. 남은 차단 지점 (3건)

1. **TIF 스캔 파일 게이트** — `info.nec.go.kr` 6 패턴 모두 실패. synapViewer 또는 viewer.jsp 통한 간접 접근만 가능해 보임.
2. **선거공보 / 5대공약 PDF** — `policy.nec.go.kr/20260603/PDF/...` 직접 URL 차단. `frmpdf` form 통한 POST 필요 (action 동적 설정).
3. **공약 OCR 텍스트** — `UELPromisePopup.do`는 `ocrCnvrSeqNo` 필요. 후보 리스트 응답에 없음 — 추가 endpoint 조사 필요.

§8 우회 전략 참고.

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

## 7. 단계별 롤아웃 (전국 4,500+ 후보 대응)

전국을 한 번에 수집하면 운영자 검수 부담이 폭증 → **선거 종류 단위로 웨이브 분할**.

| 웨이브 | 범위 | 후보 수 (추정) | 우선도 사유 |
|---|---|---|---|
| W1 | **기초단체장 (구·시·군의 장)** 226 선거구 | ~900명 | mock 시드(`positionTitle="구청장"`)와 1:1 매칭. 화면 검증이 즉시 가능 |
| W2 | **광역단체장 (시·도지사)** 17 선거구 | ~60명 | 후보 수 가장 적음, 미디어 노출 ↑ → 검수·신뢰 확보에 유리 |
| W3 | **교육감** 17 선거구 | ~50명 | 비당파(정당명 없음) → CrossCheck 룰 일부 미적용. 별도 처리 |
| W4 | **광역의원** 800+ 선거구 | ~2,500명 | 후보 수 많음, 공약 다양성 ↑ |
| W5 | **기초의원** 2,900+ 선거구 | ~2,000명 | 마지막 — 검수 비용 최대 |

각 웨이브는 자체 PR(이슈 #14~#18)로 분할 가능. **W1 완료 후 #2 시드와의 호환성을 1회 검증**한 뒤 W2~ 진행 권장.

---

## 8. 남은 공개 데이터 수집 전략

§3 매트릭스에서 ❌ / △ 표시된 데이터를 어떻게 채울지에 대한 상세 전략. 우선순위 순.

### 8-1. 🟢 **즉시 가능** — info.nec 요약 페이지 파서 (정형 14개 필드)

**규모**: 전국 5,000명 × 1 페이지 = 5,000 HTML
**예상 시간**: 1 req/2s = 약 3 시간 (rate limit 회피용 throttle)
**기술**: `cheerio` + 정규식
**의존**: 후보 huboid 리스트 (§8-2 선행 필요)

```ts
// scripts/ingest/04-parse-detail-html.ts (개요)
import * as cheerio from 'cheerio';
const $ = cheerio.load(html);
const name = $('th:contains("성명") + td').text().split('(')[0].trim();
const hanja = $('th:contains("성명") + td').text().match(/\((.+)\)/)?.[1];
const birthDate = $('th:contains("생년월일") + td').text().match(/(\d{4}\.\d{2}\.\d{2})/)?.[1];
const assetTotalCheonwon = parseInt($('th:contains("재산신고액") + td').text().replace(/,/g,''));
const assetTotalWon = assetTotalCheonwon * 1000;
// ... 14개 필드
```

**리스크**: HTML 구조가 후보 사퇴/등록무효 등 케이스에서 변형될 수 있음 → 운영자 검수 1차 필수.

---

### 8-2. 🟢 **즉시 가능** — 전국 후보 huboid 인덱싱 (policy.nec 4단계 API)

**규모**: 17 시도 × 평균 12 구 × 평균 4 선거 종류 × 평균 N 후보 = 약 4,000~5,500명
**예상 시간**: throttle 1 req/1s, 약 1~2 시간
**기술**: Node fetch + 세션 쿠키 + JSESSIONID URL 패스

```ts
// scripts/ingest/01-fetch-candidate-index.ts (개요)
// 1. 세션 발급
const sessRes = await fetch('https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25');
const jsid = sessRes.headers.get('set-cookie')?.match(/JSESSIONID=([^;]+)/)?.[1];

// 2. 시도 × 구 × 선거 종류 × sggId × 후보 4단계 cartesian
for (const subSgId of ['320260603' /* 시도지사 */, '420260603' /* 구·시·군의 장 */, ...]) {
  const regions = await postJson(`/initUCACommimentRegion.do;jsessionid=${jsid}`, { sgId, subSgId });
  for (const r of regions.regionlist) {
    const gus = await postJson(`/initUCACommimentGu.do;jsessionid=${jsid}`, { sgId, subSgId, wiwsidocode: r.wiwid, sortYn:'N' });
    for (const g of gus.gulist) {
      const sggs = await postJson(`/initUCACommimentSgg.do;jsessionid=${jsid}`, { sgId, subSgId, wiwsidocode: r.wiwid, wiwid: g.wiwid, sortYn:'N' });
      for (const s of sggs.sgglist) {
        for (let page=1; ;page++) {
          const candList = await postJson(`/initUCACommimentList.do;jsessionid=${jsid}`, {
            sgId, subSgId, hRegionId: r.wiwid, hGuId: g.wiwid, hSggId: s.sggid,
            sgTypecode, pageIndex: page, elecEndYn:'N',
          });
          // collect huboid + fileinfo + 기본 정보
          if (page * 15 >= candList.totalCnt) break;
        }
      }
    }
  }
}
```

**산출물**: `data/raw/candidate-index.json` — 전국 후보 인덱스 (huboid + 선거구 + 정당 + 기호 + PDF 경로).

**리스크**: NEC 세션 타임아웃 (30분 정도?) → 주기적 재발급 로직 필수. 동시 요청은 안 함 (NEC 차단 위험).

---

### 8-3. 🟡 **우회 필요** — TIF 스캔 파일 게이트

**상황**: 6개 URL 패턴 모두 실패. 다만 NEC 자체가 viewer.jsp / synapViewer.jsp로 표시하므로 우회 경로 존재.

**우회 전략 4가지** (시도 우선순위 순):

| 방법 | 설명 | 추정 비용 | 성공 가능성 |
|---|---|---|---|
| (A) **synapViewer 분석** | `/common/synapViewer/synapViewer.jsp?filePath=...` 호출해 변환된 HTML/이미지 받기 | 0.5일 | 높음 — viewer.jsp가 명시적으로 표시 |
| (B) **headless Chrome (Playwright)** | candidate_detail_info.xhtml 페이지에서 탭 버튼 클릭 → 새 창 열림 → 새 창 DOM에서 변환된 이미지 src 추출 | 1일 | 가장 높음 — 사용자 동작 그대로 |
| (C) **OpenAPI 신청** | `data.go.kr`에서 등록정보 API 확보 (있다면) | 신청 1~3일 | 데이터 범위 확인 후 |
| (D) **선거 종료 후 데이터 공개** | NEC가 선거 후 공식 통계 공개 시 활용 | 무한 | 시점 의존 |

**권장**: (B) 먼저. Playwright로 1명 검증 → 전국 후보 batch.

**TIF가 막혀도**: 핵심 필드 14개는 info.nec 요약에서 모두 추출 가능 → mock-수준 시연은 즉시 가능. TIF는 `assetBreakdown` 같은 부가 필드 전용.

---

### 8-4. 🟡 **우회 필요** — 공약 PDF (선거공보 / 5대공약)

**상황**: `/20260603/PDF/PBINFO/...` 직접 URL → 307 리다이렉트 `error.html`.

**우회 전략**:

1. **frmpdf form POST** — policy.nec 후보 페이지에서 미리보기 클릭 시 `frmpdf` form이 동적으로 action을 받아 POST. 그 action URL을 캡처해야 함 (Playwright 또는 openchrome network capture)
2. **frmPromiseView form** — `UELPromisePopup.do` 통해 공약 OCR 변환 텍스트만 받기 (PDF 다운로드 자체는 안 하고 텍스트만 추출 — 우리에게는 이게 더 가치)

**권장**: 2번이 더 가치 큼. OCR 변환 텍스트는 `Promise.body` 그대로 사용 가능, PDF 파싱 불필요.

**선행 작업**: `ocrCnvrSeqNo`가 어디서 오는지 확인. 후보 리스트 응답엔 없음 → 추가 endpoint 조사.

---

### 8-5. 🟡 **우회 필요** — 공약 OCR 텍스트 (`ocrCnvrSeqNo`)

**가설**: `UELPromisePopup.do`의 입력 `ocrCnvrSeqNo`는 별도 endpoint로 발급되는 식별자. 후보별·공약별 1:1 매핑일 가능성.

**조사 방법**:
1. openchrome으로 policy.nec 후보 페이지에서 공약 미리보기 클릭 → network capture로 직전 AJAX 요청 추출
2. 직전 요청이 `ocrCnvrSeqNo` 발급용 endpoint일 것 (`fnPromise5` 또는 `fnPromiseList` 류 함수)

**예상 시간**: 30분.
**가치**: 자동화 가능하면 PDF 다운로드/파싱 전부 우회 → 자동화 ◎ 등급으로 승격.

---

### 8-6. 🟢 **즉시 가능** — 후보 사진 (cdn.nec.go.kr)

**상황**: `cdn.nec.go.kr/photo_20260603/Gsg{wiwid}/Hb{huboid}/gicho/{huboid}.JPG` 200 OK, 무인증.

**전략**: 정책 결정 후 일괄 다운 (C7 재검토).
- (A) placeholder 유지 (mock 정책) — 0 비용
- (B) 자체 호스팅 — 초상권 자문 필요 / `Disclosure.photoUrl` NEC CDN URL 직접 사용 가능 (deep-link)
- (C) 자체 다운로드 후 호스팅 — CDN 의존 제거 / S3 등 비용 발생

**권장**: (B) 시작 — NEC CDN deep-link. NEC가 URL 패턴 바꿀 시 재수집.

---

### 8-7. 🟠 **외부 사이트 보강** — 교차검증·CrossCheck용

| 데이터 | 출처 | 자동화 | 활용 |
|---|---|---|---|
| 현직 공직자 재산 변동 추이 | `peti.go.kr` (공직자윤리위원회) | △ (PDF 기반) | `Disclosure.assetTotal` 교차검증 |
| 고액·상습 체납자 명단 | `nts.go.kr` (국세청, 연 1회 11월) | △ (1년 동결 데이터) | `Disclosure.taxArrears` 교차검증 |
| 정당 공약 텍스트 | `policy.nec.go.kr/plc/policy/initUPAPolicy.do?menuId=PARTY5` | ◎ | `Promise` 보조 (정당 강령 vs 개인 공약 대조) |
| 매니페스토 평가 | `manifesto.or.kr` | △ 사이트 라이선스 검토 필요 | `Promise.specificityScore` 운영자 참고 |
| 팩트체크 결과 | `factcheck.snu.ac.kr` | △ | `crossCheckText` 운영자 참고 |
| 후보자 SNS·캠프 홈페이지 | 각자 (캠프 사이트는 선거 후 사라짐) | × | 공약 보강·자기소개 (수동, archive.org 사본 권장) |

이들은 **mock → real 1차 전환 후 보강 단계**에서 작업. W1(기초단체장) 출하 시점에 없어도 PRD 정합성에는 영향 없음.

---

### 8-8. 수집 순서 종합 권장

```
[Phase A — 즉시, 1주 이내]
1. info.nec HTML 파서 작성 (cheerio + 정규식) — §8-1
2. policy.nec 4단계 API 인덱싱 스크립트 — §8-2
3. cdn.nec 후보 사진 deep-link 정책 결정 — §8-6
4. 종로구 2명 → 서울 기초단체장 25명 → W1 전국 226명 순으로 확장 검증

[Phase B — Phase A 완료 후, 2주 이내]
5. ocrCnvrSeqNo 발급 endpoint 발굴 → 공약 OCR 텍스트 수집 — §8-5
6. Playwright로 TIF 게이트 우회 검증 — §8-3 (방법 B)
7. assetBreakdown 등 보조 필드 OCR 파이프라인

[Phase C — mock→real 전환 후 보강]
8. peti / nts / manifesto / SNU 팩트체크 교차검증 데이터 — §8-7
9. 후보자 SNS·캠프 홈페이지 보강 (수동, archive.org 사본)

[Phase D — 정식 베타 진입 후]
10. OpenAPI 신청 + 1차 자동화 대체
11. cron 갱신 주기 도입
12. 정정 요청 워크플로우와 통합
```

---

## 결정 로그

```
2026-05-28 · 타깃 선거구 범위 · 전국 채택 · shaun0927
2026-05-28 · PDF 파싱 도구 · pdfjs-dist 채택 (오전) → 즉일 무효 (오후 실측, NEC는 TIF 스캔이라 OCR 필요) · shaun0927
2026-05-28 · 1순위 소스 사이트 · info.nec.go.kr/electioninfo/candidate_detail_info.xhtml (정형 HTML) + policy.nec.go.kr (인덱싱·공약 PDF) 양분 · 실측 검증
2026-05-28 · 6-키 식별자 체인 확정 · electionId/sgTypecode/regionId/guId/sggId/huboId · 실측 검증
2026-05-28 · 스키마 보강 13건 도출 · §4-2 참조 · 운영자 검토 대기
```

---

## 🚨 사람 결정 필요

### 신규 (2026-05-28 실측 후 도출)

- [ ] **OCR 라이브러리 선택** — `tesseract.js` (무료/느림) / Naver Clova OCR (유료/한국어 우수) / Google Vision (유료/범용)
- [ ] **스키마 보강 13건 수용 여부** — §4-2의 신규 필드 13개를 #2 시드·#11 API에 반영할지
- [ ] **후보 주소 노출 정책** — info.nec이 구 단위까지 주소 제공. UI에 노출 vs 비노출 (privacy)
- [ ] **후보 사진 정책 (C7 재검토)** — placeholder 유지 / NEC CDN deep-link / 자체 호스팅
- [ ] **rate-limit 정책** — NEC AJAX 호출 throttle (1 req/1s? 차단 위험)
- [ ] **TIF 우회 우선순위** — Playwright synapViewer 1주 투자 vs assetBreakdown 필드 포기

### 기존

- [x] ~~**PDF 파싱 도구 선택**~~ → 정정: cheerio (정형) + OCR (보조). pdfjs-dist 폐기.
- [ ] **공약 카테고리 9분류** 운영자 키워드 사전 확정 (PRD §11 3개 + 확장 5개 + 운영자 추가)
- [ ] **자료 갱신 주기** — 1회 동결 / 정정 시 즉시 / 정기
- [ ] **데이터 저장소** — JSON 파일 / SQLite / Supabase
- [ ] **OpenAPI 키 신청 명의** — 운영자 개인 / 팀 명의 (A2 결정 의존)
- [ ] **언론 자료 인용 방침** — 직접 인용 가능 / 운영자 요약만 허용 (저작권·금지어 양면)
- [ ] **웨이브 시작점** — W1(기초단체장) 권장 (§7) — 다른 선택 시 사유 기재
