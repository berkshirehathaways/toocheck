# [#6] 지역 선택 + 후보 목록 페이지

## 목적
사용자가 지역(MVP에선 1곳)을 선택하고, 해당 지역 후보 리스트를 카드 형태로 본다.

> 참조: PRD §6.2, §6.3, §16.2

## 산출물

```
app/(public)/districts/
├── page.tsx                                       # 지역 선택
└── [districtId]/
    └── candidates/
        └── page.tsx                                # 후보 목록

components/domain/
├── DistrictPicker.tsx
├── CandidateList.tsx
└── (재사용) CandidateCard, SortSelector            # #4 산출
```

## 지역 선택 페이지 (`/districts`)

**MVP 단순화**: mock 단계엔 지역이 1개뿐이므로 선택 UI는 형식상 존재하되 "테스트 지역 바로가기" 버튼 우선.

구성:
- 헤더 (서비스명 + 원칙 링크)
- 안내 문구: "현재 MVP 단계입니다. 테스트 지역 1곳만 제공합니다."
- 폼 (Select 3단계):
  - 선거 종류 (mock: 1개)
  - 시도 / 시군구 / 선거구 (mock: 1개씩)
- 대형 CTA: `테스트 지역 후보 보기` → `/districts/${SEED_ID}/candidates`

## 후보 목록 페이지 (`/districts/[districtId]/candidates`)

구성:

### 상단 (sticky)
- District 정보: 시도 · 시군구 · 선거구명
- 자료 기준일 (District 내 모든 후보 disclosure의 `sourceCheckedAt` 중 가장 오래된 값)
- `<SortSelector>`
- `비교표 보기` CTA → `/districts/[id]/compare`

### 본문
- `<CandidateCard>` 목록 (PRD §6.3)
  - 후보명, 정당, 기호
  - 주요 공약 2개 (specificityScore 상위 2개 제목만)
  - 배지: PRD §6.3 허용 배지만 (`전과기록 공개자료 있음` 등)
  - `원문 보기` 버튼 (`<SourceLink>`)
  - `상세 보기` 버튼 → `/candidates/[id]`

### 정렬 옵션 (PRD §3.1 허용)
1. 기호순 (default)
2. 이름순
3. 재산신고액 높은 순
4. 재산신고액 낮은 순
5. 전과기록 공개 여부 (있음 우선)
6. 체납기록 공개 여부 (있음 우선)
7. 공약 구체성 높은 순

### needs_check 후보 처리
- 카드에 `<DataPendingNote>` 배지로 "자료 확인 중" 표시
- 카드의 민감 항목(재산/전과 등)은 가림
- 상세 진입 가능하나 §7에서 동일하게 가림 처리

## 데이터 흐름
- 서버 컴포넌트에서 `listCandidates(districtId)` 호출 (loader 직접)
- 정렬은 클라이언트 컴포넌트 + URL query `?sort=`
- 정렬 변경 시 `router.replace` (history 더럽히지 않음)

## 수용 기준
- [ ] 기본 정렬 = 기호순 (PRD §3.1)
- [ ] 정렬 변경 시 URL query `?sort=` 동기화 (공유 가능)
- [ ] 정렬 옵션 라벨 금지어 0건
- [ ] needs_check 후보는 카드에 `자료 확인 중` 배지로 표시 (PRD §18.1)
- [ ] 모든 카드 동일 형식 (PRD §16.2)
- [ ] 모바일 1열, ≥640px 2열 / ≥1024px 3열
- [ ] 카드의 모든 sourceUrl이 살아있음 (mock 단계엔 placeholder 허용)
- [ ] 후보 0명 시 빈 상태 UI

## 의존
- #2, #3, #4

## Out of scope
- 검색
- 후보 즐겨찾기
- 위치기반 자동 지역 매칭

## 🚨 사람 결정 필요

- [ ] **지역 선택 폼 표시 수준**: 3단계 Select 모두 표시 vs `테스트 지역` 버튼만 표시
  - 권장: **둘 다** — 정식 폼 + 큰 바로가기 버튼
- [ ] **정렬 라벨 워딩**:
  - "재산신고액 높은 순" vs "재산 많은 순(공개자료 기준)" — 정확한 문구
  - "전과기록 공개 여부" vs "전과기록 공개자료 있음 우선" — 정확한 문구
- [ ] **needs_check 후보의 카드 표시 여부**: 표시(권장, "후보가 있다는 것 자체가 정보") vs 미표시
- [ ] **카드에 노출할 배지 최대 개수**: 무제한 vs 3개로 제한 + "+N개 더보기"
- [ ] **카드 주요 공약 표시**: 상위 2개 (PRD 그대로) vs 상위 3개 vs 분야별 1개
- [ ] **자료 기준일 산정**: District 내 최소값(권장) vs 가장 최신값 vs Election 단위 단일값
- [ ] **모바일 sticky 헤더 포함 요소**: 정렬셀렉터까지(권장) vs District 정보까지만
