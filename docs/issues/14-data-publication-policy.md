# [#14] 데이터 공개 정책 + 수집 파이프라인 (FINAL)

## 목적
지금까지 #13 검증 사이클로 확보한 모든 신규 데이터에 대해:
1. 사이트 공개 여부·표시 방식을 **최종 확정**
2. 각 데이터의 **수집 파이프라인**을 명확히 정의 (재현·확장 가능)

> 참조: PRD §3 비당파성, §9·§17 표현 정책, #13 §6 수집 사이클 기록
>
> 본 문서는 **2026-05-28 검증 사이클 종료 시점의 최종 결정**. 추가 출처 발견 시 별도 이슈로 분리.

---

## 0. 결정 원칙 (모든 항목에 적용)

| 원칙 | 적용 |
|---|---|
| **공인 출처 우선** | NEC · 서울시의회 · peti · Wikidata(가드레일) 만 사용. 나무위키/SNS/언론 본문 자동 인용 금지 |
| **수집 안 된 정보 미표시** | 외부 위키로 메우지 않음. 빈 상태가 더 안전 (#13 §6-3 이력) |
| **자동 판정 미노출** | specificityScore / checkPriorityScore 같은 정량 판정은 UI 비노출 (PR #50) |
| **사실만, 추론 없음** | "급증·급감·매수·매도" 등 수식어는 운영자 검수 후만 |
| **표현 단일 색** | 모든 후보 동일 색상 / 정렬 / 폰트 (PRD §16) |
| **privacy ≠ 알권리 충돌 시** | 지역은 시도 단위 / 가족은 합계만 / 가족 구성원 분리 비공개 |
| **출처 라이선스 명시** | 공공누리 · CC0 · CC BY-SA 4.0 푸터 또는 항목 옆 표기 |

---

## 1. 출처별 수집 파이프라인 (자동화 명세)

### 1-1. NEC 후보자 정보공개 (`info.nec.go.kr`)

**대상 데이터**: 이름·한자명·생년월일·성별·직업·학력·경력·재산총액·5년납세·체납·병역·전과(요약)·입후보 횟수
**자동화 등급**: ◎ (cheerio HTML 파싱)

```bash
# 입력: huboid (NEC 후보 식별자)
URL="http://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId=${HUBOID}"
curl -sL -H 'User-Agent: Mozilla/5.0' "$URL" -o "raw/${HUBOID}_detail.html"

# 파서: scripts/ingest/02-parse-detail-html.ts
# - cheerio.load(html)
# - 정형 14개 필드를 [라벨]→[값] 형태로 추출
# - 천원 단위는 ×1000 으로 원 환산
# - 한자명은 정규식 (劉燦鍾) 패턴
```

**스키마 매핑**: `Candidate.{name, nameHanja, birthDate, gender, occupation, education, career, electionRunCount}` + `Disclosure.{assetTotal, fiveYearTaxPaidKrw, fiveYearTaxArrearsKrw, currentTaxArrearsKrw, militaryRecord, criminalRecordCountSummary}`

---

### 1-2. NEC 후보 인덱싱 (`policy.nec.go.kr`)

**대상**: 전국 후보 huboid 인덱스 + PDF 경로 + 공약 OCR ocrCnvrSeqNo
**자동화 등급**: ◎

```bash
# 1) 세션 발급
curl -c cookies -H 'User-Agent: Mozilla/5.0' \
  "https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25" -o /dev/null
JSESSIONID=$(awk '/JSESSIONID/{print $7}' cookies)

# 2) 4단계 cartesian (선거 → 시도 → 구 → 선거구 → 후보)
# - initUCACommimentRegion.do  (시도)
# - initUCACommimentGu.do       (구)
# - initUCACommimentSgg.do      (선거구)
# - initUCACommimentList.do     (후보 + fileinfo)
# 후보 리스트 응답 fileinfo 필드의 "5대공약||{PDF}||{ocrCnvrSeqNo}" 파싱
```

**스키마 매핑**: `Candidate.{ballotNumber, party, necId}` + `Promise.ocrCnvrSeqNo` (수집용 내부 식별자)

---

### 1-3. NEC 공약 OCR 텍스트 (`UELPromisePopupView.do`)

```bash
curl -s -b cookies -X POST \
  "https://policy.nec.go.kr/plc/commiment/UELPromisePopupView.do;jsessionid=${JSESSIONID}" \
  --data "ocrCnvrSeqNo=${SEQ}&menuName=제9회 전국동시지방선거" \
  -o "raw/promises_${HUBOID}.html"
```

**파서**: 정규식으로 1~5 공약 분리 + 4요소 (목표/이행방법/이행기간/재원조달방안) 자동 판정.
**스키마 매핑**: `CandidatePromise.{title, body, necElements}`. **specificityScore는 UI 비노출이라 채우지 않음**.

---

### 1-4. NEC CDN 후보 사진

```
http://cdn.nec.go.kr/photo_20260603/Gsg{wiwid}/Hb{huboid}/gicho/{huboid}.JPG
```

deep-link 그대로 `Disclosure.photoUrl`에 저장.

---

### 1-5. 서울시의회 의정활동 (`smc.seoul.kr`)

**대상**: 전직 서울시의원 출신 후보의 의정 경력
**자동화 등급**: ◎

```bash
# 입력: 후보명 → 의원 mno 매핑 (run-once 수동 매핑 표 유지)
# 예: 유찬종 = mno=872, 9대 (2014-2018)
URL="https://www.smc.seoul.kr/main/memberPop.do?mno=${MNO}&period=${PERIOD}"
curl -sL -H 'User-Agent: Mozilla/5.0' "$URL" -o "raw/smc_${MNO}_${PERIOD}.html"

# 파서: 학력/경력/위원회 활동 표 추출
# - 한자명 검증 (NEC와 동일한지 확인)
# - 위원회 활동 8건: [위원회명](시작일~종료일) 패턴
```

**스키마 매핑**: `Candidate.{nameEnglish, councilTerms[]}`.
**검수 게이트**: 위원회명에 §17 금지어 (예: "의혹", "위반") 포함 시 운영자 검수 큐로 분기.

---

### 1-6. 공직자윤리위 재산 detail (`peti.go.kr`) — **현직자 한정**

**대상**: 현직 공직자(국회의원·단체장) 후보의 매년 정기 재산변동신고
**자동화 등급**: △ (세션 + CSRF 토큰 관리 필요)

```bash
# 1) 세션 발급
curl -c peti-cookies -H 'User-Agent: Mozilla/5.0' "https://www.peti.go.kr/main.do" -o /dev/null
curl -b peti-cookies -c peti-cookies "https://www.peti.go.kr/peOptpListVie.do" -o page.html
CSRF=$(grep -oE 'id="csrfToken"[^>]*value="[^"]+"' page.html | grep -oE 'value="[^"]+"' | sed 's/value="//;s/"//')

# 2) AJAX 검색 (성명만)
curl -b peti-cookies -X POST \
  "https://www.peti.go.kr/peoptp/getListOptpListVie.do" \
  --data-urlencode "rgsDtrNm=${NAME}" \
  --data-urlencode "fromOptpDt=2022-01-01" \
  --data-urlencode "toOptpDt=2026-12-31" \
  --data-urlencode "pageIndex=1&pageUnit=100" \
  -o search.json

# 3) 결과에서 rgsMno 추출 → detail 호출
RGSMNO=$(jq -r '.list[0].rgsMno' search.json)
curl -b peti-cookies -X POST \
  "https://www.peti.go.kr/peoptp/getListDetailPrptOptp.do" \
  --data-urlencode "rgsMno=${RGSMNO}" \
  --data-urlencode "csrfToken=${CSRF}" \
  -o detail.json
```

**파서**: `optpList` 49개 항목을 8 카테고리로 집계, 가족 합계 별도 계산, 부동산 시도 추출.
**스키마 매핑**: `Disclosure.petiBreakdown` (스키마는 §3 참조).
**주의**: 자동화는 가능하나 운영자 검수 게이트 필수 (가족·지역 정책 적용).

---

### 1-7. Wikidata (가드레일 통과 시만)

**자동화 등급**: ◎ + 가드레일

```bash
# 1) 이름으로 Q ID 검색
Q_ID=$(curl -sG "https://www.wikidata.org/w/api.php" \
  --data-urlencode 'action=wbsearchentities' \
  --data-urlencode "search=${NAME}" \
  --data-urlencode 'language=ko&format=json&limit=5' \
  | jq -r '.search[].id')

# 2) 가드레일: 출생일 NEC vs Wikidata 일치 검증
for ID in $Q_ID; do
  WD_BIRTH=$(curl -sG "https://query.wikidata.org/sparql" \
    --data-urlencode "query=SELECT ?dob WHERE { wd:${ID} wdt:P569 ?dob } LIMIT 1" \
    -H 'Accept: application/sparql-results+json' \
    | jq -r '.results.bindings[0].dob.value[:10]')
  if [ "$WD_BIRTH" = "$NEC_BIRTH" ]; then echo "MATCH ${ID}"; break; fi
done

# 3) 일치하는 Q ID만 직위 이력 추출
# (P39=position, P580=start, P582=end, P768=electorate)
```

**가드레일 실패 시 결과**: 해당 후보 wikidata 데이터 0건 (안전 폴백).
**스키마 매핑**: `Candidate.{highSchool, councilTerms[]}` (국회의원 임기·지역구).
**outdated 필드는 매핑 금지**: 정당(P102), 직책(P39) 중 end 날짜 없는 것은 검수 후만.

---

### 1-8. 위키백과 (`ko.wikipedia.org`) — 기존 (과거 출마 표)

이미 #13 §2-1.5에 명세. 변경 없음. CC BY-SA 4.0 라이선스 표기 의무.

---

### 1-9. ⚠️ 미검증 — 운영 단계 후속 검토

본 사이클에서는 **신청 페이지 접근까지만** 확인. 키 발급·실호출·응답 검증은 미완.

| 출처 | 현재 확인된 것 | 운영자 후속 검토 필요 |
|---|---|---|
| data.go.kr 후보자 정보 (15000908) | 신청 페이지 존재, 개발단계 자동승인 | 키 발급 후 응답 스펙 검증 → 별도 이슈로 분리 |
| open.assembly.go.kr 의안 | 의안 API 목록 존재 | 동상 |

**중요**: 본 §1-9의 두 출처는 **본 이슈 #14의 확정 파이프라인에 포함되지 않음**. 향후 키 발급 후 별도 이슈(#15 가칭)로 분리.

---

## 2. 데이터별 공개 결정 — FINAL

### 2-1. ✅ 즉시 공개 (정부 공식 + 비당파 + privacy 무문제) — **22항목**

#13 §8 / 본 사이클 §1 카탈로그 표 그대로. 변경 없음.

### 2-2. ⚠️ 운영자 검수 후 공개 — **5항목 + 표시 정책**

#### A. 부동산 지역 (정문헌 토지 18건·건물 2건)

**결정**: **시·도 단위 + 건수**만 노출.

**표시 형식**:
```
토지 18건 — 충청남도 6건 · 강원특별자치도 3건 · (기타 9건)
건물 2건 — 서울특별시 2건
```

**금지**: 시·군·구·동·정확 지번·면적

**사유**: 정책 이해관계 신호는 충분히 전달, 식별 가능한 위치 정보 차단.

#### B. 가족 자산 표시 (정문헌)

**결정**: **본인 단독 수치 + 가족 포함 합계만** (구성원 분리 비공개).

**표시 형식**:
```
재산 총액
  본인 단독                                26.97억
  본인 + 가족(배우자·자녀)                 33.85억
                                          ─────
  차이 (가족 합계)                          6.88억
```

**금지**: 가족 구성원별 (배우자 6.27억 / 차남 0.41억 등) 분리·명의·신원

**사유**: peti는 법정 의무로 가족 공개하나, 우리 재게시 시 가족 privacy 보호 강화.

#### C. 유찬종 SIFC 진상규명 특별위원회

**결정**: **축약명으로 표시 + 운영자 1차 검수**.

**표시 형식**:
```
서울국제금융센터(SIFC) 진상규명 행정사무조사 특별위원회 위원
  2015-12-21 ~ 2016-06-20
  [출처 서울시의회 (공식 명칭)]
```

**원본 명칭** (`...특혜의혹...`): 출처 링크에서만 확인 가능.

**금지**: "특혜의혹" 4글자를 본문 텍스트에 사용.

**사유**: §17 자동 검사기는 정부 공식 위원회명도 차단. 축약명으로 사실성 유지 + 안전.

#### D. 전년 대비 자산 증감 (정문헌)

**결정**: **단순 수치 + 단색 + "작년 대비" 라벨**.

**표시 형식**:
```
재산 카테고리별 (2025-12-31 기준 · 작년 대비)
  토지       7.98억     +1,038만
  건물      13.62억     +3,400만
  예금       3.78억     -8,640만
  증권       1.62억     +4,233만
  채무      -3.77억     채무 2,855만 감소
  회원권     1.85억     변동 없음
  가상자산   0.37억    -1.77억
  차량 등    0.67억     -1,018만
```

**금지**:
- "급증·급감·폭락·폭등" 수식어
- 색상 강조 (모든 수치 회색 단일)
- 화살표 (▲▼) — 일부 운영자만 허용. 비표시 권장.

**사유**: 객관 사실(숫자)만 노출, 정치적 인상 형성 차단.

#### E. 임기 조기 종료 (유찬종 2018-04-12)

**결정**: **표시 보류**. 운영자가 사퇴/사유를 정부 공식 자료로 확인 전엔 비표시.

**사유**: 사유 미확인 상태로 노출 시 §250 위험.

### 2-3. ❌ 공개 금지 — **6항목**

(이전 표 그대로 유지)

1. 부동산 정확 지번·면적
2. 가족 구성원별 정확 자산 (배우자·자녀 명의 분리)
3. Wikidata "바른정당" outdated
4. Wikidata "동국대학교 고용" (직책 미명)
5. 유찬종 임기 조기 종료 사유 (미검증)
6. peti 부동산 매수·매도 이력 추정

---

## 3. 스키마 확정

```ts
// types/domain.ts

/** 의정 활동 단위 (시의회·국회 통합) */
export interface CouncilTerm {
  council: string;           // "서울특별시의회 9대" / "대한민국 국회 17대"
  position: string;          // 위원회 명·국회의원 본직 등
  start: string;             // ISO YYYY-MM-DD
  end: string;
  electoralDistrict?: string;
  sourceUrl: string;
  sourceLicense?: 'public_record' | 'CC0' | 'CC BY-SA 4.0';
  needsReview?: boolean;     // 검수 필요 표시 (§17 의심 단어 포함 시 true)
}

/** peti 재산 정밀 분해 (현직자 한정) */
export interface AssetCategoryBreakdown {
  asOf: string;              // "2025-12-31"
  disclosedAt: string;       // "2026-03-26"
  publicNoticeNo: string;
  categories: Array<{
    name: '토지' | '건물' | '예금' | '증권' | '채무'
        | '회원권' | '가상자산' | '자동차등' | '기타';
    totalKrw: number;
    itemCount: number;
    yearOverYearChangeKrw?: number; // 운영자 검수 후 채움
  }>;
  /** 시도 단위 + 건수만. 시·군·구 이하 비저장. */
  realEstateRegions?: Array<{ region: string; itemCount: number }>;
  /** 본인 단독 합계 */
  selfOnlyKrw: number;
  /** 본인 + 가족 합계 (가족 구성원별 비저장) */
  selfPlusFamilyKrw: number;
}

export interface Candidate {
  // 기존 …
  nameEnglish?: string;
  highSchool?: string;       // Wikidata 가드레일 통과 시만
  councilTerms?: CouncilTerm[];
}

export interface CandidateDisclosure {
  // 기존 …
  petiBreakdown?: AssetCategoryBreakdown;
}
```

---

## 4. UI 표시 위치 (확정)

### 후보 상세 페이지 신규 섹션 2개

1. **인적사항** (기존) — 영문명 + 출신고 추가 (Wikidata 검증 시)
2. **🆕 의정 활동** — 시의회·국회 통합 시간순 표
   ```
   ┌─ 의정 활동 ──────────────────────────────────┐
   │ 시기            기관·직위                   │
   │ 2014-2018  서울특별시의회 9대 (종로 2)      │
   │            ├ 시의회 본직                      │
   │            ├ 주택공간위원회위원                │
   │            ├ 예산결산특별위원회위원 ×2          │
   │            ├ 정책위원회위원                   │
   │            ├ 한옥지원특별위원회위원             │
   │            └ 인사청문특별위원회위원 (2017)     │
   │ 2017       서울국제금융센터(SIFC) 진상규명     │
   │            행정사무조사 특별위원회위원         │
   │            ⓘ 출처 서울시의회                  │
   └────────────────────────────────────────────┘
   ```
3. **공개 자료 보강** (기존 섹션) — assetBreakdown 막대를 정문헌 실데이터로 교체

### "구성 비율 미수집" 안내 정책

- 정문헌: peti 실데이터로 막대 표시
- 유찬종: 기존 "구성 비율은 등록서류 검수 후 표시됩니다." 안내 유지 (peti 자료 없음 — 비현직)

---

## 5. 산출물 (PR 단위)

| PR | 작업 | 의존 |
|---|---|---|
| **PR 1: 스키마 확정** | `types/domain.ts` 3개 인터페이스 추가 | 단독 |
| **PR 2: 수집 스크립트 6종** | `scripts/ingest/0{1..6}-*.ts` — NEC index / NEC detail / NEC promise / SMC / peti / Wikidata | PR 1 |
| **PR 3: 시드 보강** | `mocks/seed.ts`에 유찬종·정문헌 신규 27항목 (즉시 22 + 검수 5) 입력 | PR 1 |
| **PR 4: UI** | 의정 활동 섹션 신규 + assetBreakdown 실데이터 + 영문명·출신고 | PR 3 |
| **PR 5: 운영자 검수 항목 표시** | A·B·C·D 4건 (지역 단위 / 가족 합계 / SIFC 축약 / 증감 단색) | PR 4 |

OpenAPI 활용은 본 이슈 범위 밖 (§1-9 참조).

---

## 6. 수집·표시 흐름 (운영 시)

```
[수집 단계]
  ① NEC 인덱싱 (policy.nec) → 전국 huboid 리스트
  ② NEC HTML 파싱 (info.nec) → 정형 14필드
  ③ NEC OCR (UELPromisePopupView) → 5대공약
  ④ 위키백과 → 과거 출마 결과 (검증 가능 후보만)
  ⑤ 서울시의회 (현직·전직 시의원 후보만) → 의정활동
  ⑥ Wikidata (가드레일 통과 시만) → 임기·출신고
  ⑦ peti (현직자만) → 재산 detail
                                ↓
[검수 게이트]
  reviewStatus: pending → reviewed
  - §17 금지어 자동 체크
  - 운영자 검수 항목 4건 (A·B·C·D) 표시 확정
                                ↓
[배포]
  mocks/seed.ts 또는 data/curated/*.json
  → Vercel 자동 배포
```

---

## 수용 기준

- [x] 22개 즉시 공개 항목 = 정부 공식 출처 + 비당파 + privacy 무문제
- [x] 5개 운영자 검수 항목 = 표시 정책 명시 (A·B·C·D)
- [x] 6개 공개 금지 항목 = 사유 명시
- [x] 7개 수집 파이프라인 = 재현 가능한 curl/파서 명세
- [x] 스키마 3개 인터페이스 확정
- [x] PR 6개 단위 분할

## 의존
- #2 (도메인 타입)
- #11 (Mock API)
- #13 (실데이터 수집 갭 트래커 — 본 문서가 후속)

## Out of scope
- 전국 후보 일괄 수집 (별도 wave PR로 분리)
- TIF OCR (재산 detail은 peti로 대체 가능. 비현직 후보 한정 미해결)
- 운영자 검수 어드민 UI (별도 #15 후속)

## 결정 로그

```
2026-05-28 · A 부동산 지역 단위 · 시·도 + 건수만 · shaun0927 (권장안 채택)
2026-05-28 · B 가족 자산 표시 · 본인 단독 + 본인+가족 통합 합계 2단 · shaun0927 (권장안 채택)
2026-05-28 · C 유찬종 SIFC 위원회 · 축약명 "진상규명 행정사무조사 특별위원회" · shaun0927 (권장안 채택)
2026-05-28 · D 전년 증감 표현 · 단색 회색 + "작년 대비" 라벨, 화살표·색상 강조 비표시 · shaun0927 (권장안 채택)
2026-05-28 · E OpenAPI 키 발급 명의 · 운영주체 A2 결정 완료 후 진행 · 보류
```

## 🚨 사람 결정 필요

- [x] ~~A·B·C·D 4건~~ → 권장안 일괄 채택 (2026-05-28 결정 로그 참조)
- [ ] **OpenAPI 키 발급 명의** — 운영주체(A2) 결정 후 별도 이슈로 분리 (#15 가칭)
