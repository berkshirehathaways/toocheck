# 수집 파이프라인 — #14 §1 확정 명세

운영자가 CLI로 실행하는 수집 스크립트.
각 스크립트는 **재현 가능한 curl/파서 패턴**을 코드화 + 출처별 단일 단위 처리.

## 전국 모드 (1차 — 후보자 등록 명부)

```bash
# 전국 17 시·도 × 5 sgType 풀 크롤 (~10~15분)
pnpm tsx scripts/ingest/01b-fetch-national-roster.ts

# 필터
pnpm tsx scripts/ingest/01b-fetch-national-roster.ts --sido=1100        # 서울만
pnpm tsx scripts/ingest/01b-fetch-national-roster.ts --sgType=3         # 시·도지사만
pnpm tsx scripts/ingest/01b-fetch-national-roster.ts --sido=1100 --sgType=4
```

**산출**: `data/curated/roster-2026.json` — 후보자 등록 명부 + 각 후보별 6종 수집 체크리스트.

### policy.nec.go.kr 커버리지 + 직책별 차별화 (2026-05-28 확정)

| sgTypecode | OfficeKind | 선거 | 정당 | 비례 | 5대공약 의무 | kind |
|---|---|---|---|---|---|---|
| 3 | `metropolitan_governor` | 시·도지사 | O | — | O | individual |
| 11 | `education_superintendent` | 교육감 | **X (법률)** | — | O | individual |
| 4 | `basic_governor` | 구·시·군의 장 | O | — | O | individual |
| 5 | `metropolitan_member` | 시·도의원(지역구) | O | — | O | individual |
| **6** | `basic_member` | **구·시·군의 의원(지역구)** | O | — | **X** | individual |
| 8 | `metropolitan_proportional` | 광역의원 비례대표 | O | O | O | party (jdid) |
| 9 | `basic_proportional` | 기초의원 비례대표 | O | O | **X** | party (jdid) |

→ **7 sgType 전수 인덱싱** — 전국 모든 후보 huboid 또는 정당명부 jdid 단위 확보.
→ "공약 의무 X" 직책은 NEC 5대공약 미게재 → UI에서 "공약 미공개 (NEC 의무 비대상)" 안내 필요.

> **2026-05-28 정정**: 이전 문서에 `sgType=7 = 기초의원 지역구`로 적었으나 **실제는 sgType=6**.
> policy.nec UI 라벨 "구·시·군의회의원선거" 확인 후 매핑 정정. ~7,000명이 sgType=6 누락분.

### 직책별 데이터 차별화 매트릭스

| 필드 | governor·member 공통 | 교육감 | 비례대표 |
|---|---|---|---|
| `party` | 표시 | **공란** | 표시 (정당명부) |
| `ballotNumber` | 후보 기호 | 후보 기호 | **명부 순위** (`proportionalRank`) |
| `councilTerms` | 정치 의정활동 | — | 정치 의정활동 |
| `educationCareer` | — | **교원·학교 운영 경력** | — |
| 5대공약 | 표시 | 표시 | 표시 (정당명부) |
| 5대공약 (sgType 6/9) | "NEC 비대상" 안내 | — | "NEC 비대상" 안내 |

→ 도메인 타입 `OfficeKind` + `OFFICE_PROFILES` 참조 (`types/domain.ts`).

## 단계별 수집 (huboid 단위 후보 한정)

전국 명부 확보 후, huboid를 02 ~ 06으로 보강:

```bash
# 종로구 1번 후보 (유찬종) 예시
HUBOID=100154016

pnpm tsx scripts/ingest/02-parse-detail-html.ts $HUBOID \
  > data/curated/${HUBOID}_detail.json

pnpm tsx scripts/ingest/06-fetch-wikidata.ts "유찬종" "1959-11-20" \
  > data/curated/${HUBOID}_wiki.json

# 서울 시의원 출신: smc.seoul.kr 보강
pnpm tsx scripts/ingest/04-fetch-smc.ts 872 9 \
  > data/curated/${HUBOID}_smc.json
```

## 체크리스트 자동 갱신

수집 산출물이 늘 때마다 roster의 `collected.{필드}` 플래그 동기화:

```bash
pnpm tsx scripts/ingest/07-update-checklist.ts            # 저장
pnpm tsx scripts/ingest/07-update-checklist.ts --dry-run  # 미리보기
```

플래그 매칭 규칙:

| 파일 패턴 | 마크되는 플래그 |
|---|---|
| `{huboId}_detail.json` (with `photoUrl`) | `necDetail` + `necPhoto` |
| `{huboId}_promise.json` | `necPromise` |
| `{huboId}_wiki.json` | `wikidata` |
| `{huboId}_smc.json` | `smcCouncil` |
| `{huboId}_peti.json` | `petiBreakdown` |

진행률 통계는 roster JSON의 `checklistStats` 섹션에 누적.

## 스크립트 목록

| # | 파일 | 입력 | 출력 |
|---|---|---|---|
| 01 | fetch-candidate-index.ts | sgId, subSgId, wiwsidocode, wiwid | 단일 (시·도, 구) 후보 인덱스 |
| **01b** | **fetch-national-roster.ts** | **(선택) --sido, --sgType** | **전국 후보 명부 + 체크리스트** |
| 02 | parse-detail-html.ts | huboid (info.nec) | 정형 14 필드 JSON |
| 03 | fetch-promise-text.ts | ocrCnvrSeqNo | 5대공약 본문 + NEC 4요소 |
| 04 | fetch-smc.ts | mno, period | 서울시의원 의정활동 |
| 05 | fetch-peti.ts | 성명 | 재산 카테고리별 + 가족 합계 |
| 06 | fetch-wikidata.ts | 이름, NEC 출생일 | Wikidata 정보 (가드레일 통과 시만) |
| **07** | **update-checklist.ts** | **roster 파일 + curated 디렉터리** | **roster 체크리스트 갱신** |
| **08** | **build-roster-summary.ts** | **roster-2026.json** | **룩업용 슬림 요약 (시·도/시·군·구/선거구 카운트·인덱스)** |
| **09** | **build-dong-codes.ts** | **큐레이션 SEED + (선택) data/raw/dong-codes-extra/\*.csv** | **법정동코드 → 행정동명 매핑** |
| **12** | **build-sigungu-candidates.ts** | **roster-2026.json** | **시·군·구별 후보 인덱스 (시군구 검색 UX의 핵심)** |
| **11** | **build-assembly-district-map.ts** | **별표 CSV + 08·09 산출물** | **행정동 → 광역의원·기초의원 선거구 매핑 (정밀 모드)** |

## 내 지역구 후보 찾기 (#52)

**주 검색 = 시·군·구**: "양천구"만 입력하면 그 시·군·구의 5종 선거(시·도지사·교육감·구청장·시·도의원·구의원) 후보를 선거별로 모두 보여준다. 거주 동까지 입력하면 시·도의원·구의원을 정확한 선거구로 좁히는 **정밀 모드**(선택)가 추가로 동작한다.

```bash
# 시·군·구 검색 데이터 (주 검색) — 시·군·구별 전체 후보
pnpm tsx scripts/ingest/12-build-sigungu-candidates.ts

# --- 정밀 모드(동→선거구) 데이터 (선택) ---
pnpm tsx scripts/ingest/08-build-roster-summary.ts          # roster 슬림 요약
pnpm tsx scripts/ingest/09-build-dong-codes.ts              # 법정동→행정동 보강
python3 scripts/ingest/parse_byeolpyo2.py                   # 광역의원: 공직선거법 별표2 (전국 14 시·도)
python3 scripts/ingest/fetch_gicho_ordinances.py            # 기초의원: 시·도 조례 별표 (REGISTRY 9개 시·도)
pnpm tsx scripts/ingest/11-build-assembly-district-map.ts   # 행정동→선거구 정밀 매핑 빌드
```

### 검색 UX 2계층

| 계층 | 입력 | 동작 | 커버리지 |
|---|---|---|---|
| **주 검색** | 시·군·구명 (예: 양천구) | 그 시·군·구 5종 선거 후보 전체 표시 | **전국 256 시·군·구 (roster 기반)** |
| **정밀 모드** | + 거주 동/주소 | 시·도의원·구의원을 1개 선거구로 확정 | 광역 전국 / 기초 9개 시·도 (별표·조례) |

- API: `/api/districts/by-region?sido=&sigungu=` (주 검색), `/api/districts/sigungu-list` (자동완성), `/api/districts/lookup?...&hname=` (정밀).
- 제주·세종은 단층제 → 구·시·군의 장·구·시·군의 의원 선거 없음(0건 정상, UI 미표시).
- 2026 통합: 광주·전남의 시·도 단위 선거는 "전남광주통합특별시"로 등록 → 인덱스에서 물리 시·도로 재매핑(guCode 기준).

### 법령 별표 HWP 파싱 (핵심 데이터 소스)

동→지방의원 선거구 매핑은 **공개 데이터셋이 없어** law.go.kr 법령 별표(HWP)에서 직접 추출한다.
HWP 5.x(CFB)의 `BodyText/Section0`을 zlib raw-deflate 해제 → `HWPTAG_PARA_TEXT(67)` 레코드 복원.

| 스크립트 | 소스 | 산출 |
|---|---|---|
| `parse_byeolpyo2.py` | 공직선거법 별표2 (시·도의회의원 지역선거구구역표) | 광역의원 전국 14 시·도, 741 선거구, 3468 동 |
| `parse_byeolpyo_gicho.py` | 시·도 자치구·시·군의원 선거구 조례 별표 | 기초의원 (시·도별, 표 형식 보정 필요) |
| `fetch_gicho_ordinances.py` | REGISTRY(시·도→ordinSeq) 일괄 | `ordinInfoR.do`→flSeq→다운로드→파싱 |

- **제주특별자치도 광역의원**: 제주특별법 소관 → 별표2 미포함 → itemized fallback.
- **기초의원 커버리지**: 서울·경남 검증완료. 나머지 시·도는 조례 별표 표 구조가 달라 `parse_byeolpyo_gicho` 시·도별 보정 + `fetch_gicho_ordinances.py`의 REGISTRY 등록 필요.
- **품질 게이팅**: `11-build-assembly-district-map.ts`가 sggName→sggId 미해결 행을 경고·제외 → 오독 데이터는 자동으로 itemized fallback (부정확 데이터 미배포).

**매칭 정밀도 5단계** (`lib/district/resolve.ts`):
- `dong` — 조례 기반 행정동 정밀 매칭. 광역/기초의원 선거구 1곳 확정 (assembly-district-map 커버 지역).
- `sigungu_unique` — 시·군·구에 광역/기초의원 선거구가 **1곳뿐** → roster만으로 자동 정밀 확정 (조례 불필요).
- `sigungu` — 복수 선거구 itemized fallback. 각 선거구 {이름, 후보수}를 모두 노출, 거주 동에 따라 택1.
- `sido` — 시·도지사·교육감 (시·도 1:1, 전국 결정적).
- `none` — 식별 실패.

**전국 정확 매칭 보장**:
- 시·도지사·교육감·구청장은 **전국 278개 시·군·구 결정적 매칭**.
- 일반구(예: 성남시분당구)는 시장(basic_governor)이 형제 구에 등록 → `getBasicGovernor`가 "○○시" prefix로 fallback.
- 2026 통합: 광주광역시·전라남도의 광역단체장/교육감은 NEC가 "전남광주통합특별시"로 등록 → `SIDO_LEVEL_ALIAS`로 매핑.

**동 단위 정밀 매칭 확장 (조례 큐레이션)**:
- `data/raw/assembly-districts/*.csv` 추가만으로 코드 수정 없이 커버리지 확장 (형식은 해당 디렉토리 README 참조).
- 또는 `11-build-assembly-district-map.ts`의 내장 `CURATED` 배열에 항목 push.
- 미커버 시·군·구는 자동으로 `sigungu_unique`(단일) 또는 `sigungu`(복수) fallback 유지.
- 전국 기준 광역의원 209곳 / 기초의원 252곳이 복수 선거구 → 점진 큐레이션 대상.
- 조례 출처(`needsReview: true`) 항목은 운영자 검수 후 확정.

## 검수 게이트

각 스크립트는 `reviewStatus: 'pending'` 으로 출력. 운영자가 검수 후 `'reviewed'` 로 승격.
**§17 의심 단어 자동 검출**: `lib/forbidden-words.ts` 매칭 시 `needsReview: true`.
