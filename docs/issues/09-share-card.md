# [#9] 공유 카드 생성

## 목적
사용자가 **후보명을 노출하지 않고** 지역 공개정보 요약을 공유한다. **후보명 비공개가 기본값**.

> 참조: PRD §6.6, §16.5

## 산출물

```
app/(public)/share/[districtId]/
└── page.tsx                                   # 카드 선택/미리보기/생성 UI

app/api/share-card/
└── route.ts                                   # POST: 이미지 렌더

components/domain/share/
├── RegionSummaryCard.tsx                       # 카드 1: 지역 요약
├── CompareCardShare.tsx                        # 카드 2: 후보 비교 (후보명 토글)
└── ChecklistCard.tsx                            # 카드 3: 투표 전 체크리스트

lib/
└── share-card-render.ts                        # satori → resvg PNG
```

## 카드 종류 (PRD §6.6)

### 1. 우리 지역 공개정보 요약 (후보명 비공개 강제)
```
2026 지방선거 · 샘플 시 가나구청장
─────────────────────────────────
전과기록 공개자료 있음    1명
체납기록 공개자료 있음    1명
재산신고액 10억 이상      2명
공약 구체성 높음          1명
─────────────────────────────────
자료 기준일 2026-05-20
toocheck.example.com
```

### 2. 후보 비교 카드 (후보명 토글, 기본 OFF)
- OFF 상태: "기호 1 · 정당 A" 형식
- ON 상태: "기호 1 · 김ㅇㅇ · 정당 A" — 명시적 confirm 필요

### 3. 투표 전 체크리스트 (정적 카드)
PRD §6.6 그대로:
```
투표 전 체크리스트
1. 공약
2. 재산
3. 납세 및 체납
4. 병역
5. 전과기록
6. 원문 자료
```

## 모든 카드 공통 요소 (PRD §16.5)
- 자료 기준일
- 서비스명 + URL
- "공개자료 기반 비당파적 비교" 워터마크 (선택)

## 기술 스택
- **권장: satori + @resvg/resvg-js** — 서버 렌더, 한글 폰트 임베드, 결과 PNG
- 대안: `html-to-image` (클라이언트, 한글 폰트 깨짐 위험)
- Next.js Route Handler에서 `Response`로 image/png 스트림 반환

## API

```ts
// POST /api/share-card
interface ShareCardRequest {
  districtId: string;
  cardType: 'region_summary' | 'compare' | 'checklist';
  showCandidateNames?: boolean;   // default false
  size?: '1080x1080' | '1080x1920';   // default 1080x1080
}
// Response: image/png stream
```

## UI 흐름 (`/share/[districtId]`)
1. 카드 종류 선택 (3개 탭)
2. 옵션 선택 (사이즈 / 후보명 노출)
3. 실시간 미리보기 (DOM 미리보기 + "생성하기" 버튼)
4. "생성하기" 클릭 → API 호출 → PNG 다운로드 (`a.download`) + Web Share API (지원 기기)

## 폰트
- Pretendard Bold/Regular (.ttf or .otf 서버 임베드)
- satori는 `fonts: [{ name, data, weight, style }]` 형태로 등록

## 수용 기준
- [ ] 기본 공유 이미지는 후보명 비공개 (PRD §16.5)
- [ ] 후보명 포함 토글 OFF → ON 시 명시적 confirm dialog
- [ ] 카드 하단에 자료 기준일 + 서비스 URL 노출
- [ ] 1080×1080 + 1080×1920 두 사이즈 지원
- [ ] 한글 폰트 깨짐 0건
- [ ] 카드 내 모든 문구 금지어 검사 통과
- [ ] PNG 파일명 규칙: `toocheck-${districtId}-${cardType}-${size}.png`
- [ ] Web Share API 지원 기기에서 시스템 공유 시트 호출

## 의존
- #2, #3, #4, #6, #7

## Out of scope
- 실제 SNS API 연동 (Web Share API만)
- 사용자 커스텀 디자인 에디터
- GIF/동영상

## 🚨 사람 결정 필요

- [ ] **렌더 기술**: satori + resvg (권장, 서버, 폰트 안정) vs html-to-image (클라, 셋업 간단)
- [ ] **이미지 사이즈**: 1080×1080 (정사각) + 1080×1920 (스토리) 둘 다 (권장) vs 1개만
- [ ] **재산 10억 임계값**: PRD §6.6 예시 그대로 10억 vs 5억 vs 20억 — District 평균 대비 % 로 동적 계산도 가능
- [ ] **후보명 비공개 식별 단위**: 기호(권장, PRD 비당파성 일관) vs "후보 A/B/C"
- [ ] **워터마크 디자인**: 텍스트(`toocheck.example.com`) vs 로고 (디자인 발주 시)
- [ ] **공유 카드에 정당명 노출**: 노출(현재안) vs 미노출 (더 비당파적)
- [ ] **이미지 캐싱**: 매번 새로 렌더(권장, 단순) vs 해시 기반 캐시
- [ ] **카드 디자인 시안**: 본 이슈에서 즉시 구현 vs 디자이너 시안 후 작업
