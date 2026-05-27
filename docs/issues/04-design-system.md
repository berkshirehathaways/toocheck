# [#4] 디자인 시스템 & 공통 컴포넌트

## 목적
모든 사용자 화면에서 공통으로 사용할 도메인 컴포넌트를 제작한다. PRD가 강조하는 **"건조한 표현"**과 **"원문 우선"** 원칙을 컴포넌트 레벨에서 강제(컴파일 타임/런타임)한다.

> 참조: PRD §3, §6, §9, §16, §17

## 산출물

### shadcn 프리미티브 추가
```bash
pnpm dlx shadcn@latest add \
  button card badge dialog sheet select tabs tooltip \
  toast separator alert input textarea label
```

### 도메인 컴포넌트 (`components/domain/`)

| 컴포넌트 | 목적 | 주요 props |
|---|---|---|
| `<SourceLink>` | 원문 링크 + 자료 기준일 강제 | `href, date, label?, className?` |
| `<NeutralBadge>` | 금지어 검사 통과 강제 배지 | `variant: 'info' \| 'check' \| 'high_attention'` |
| `<DisclosureCard>` | 공개정보 4섹션 카드 | `candidate, disclosure` |
| `<PromiseCard>` | 공약 1개 카드 | `promise` |
| `<CheckCard>` | CandidateCheckCard 렌더링 | `card` |
| `<CandidateCard>` | 목록 카드 | `candidate, badges, summary` |
| `<CompareRow>` | 비교표 row (desktop) | `row` |
| `<CompareCardMobile>` | 비교표 카드 (mobile transpose) | `row` |
| `<CrossCheckBlock>` | 함께 확인할 지점 (PRD §11) | `candidate, items` |
| `<CorrectionLink>` | 정정 요청 진입 (query 자동 prefill) | `candidateId, fieldName?` |
| `<SortSelector>` | 정렬 셀렉터 | `options, value, onChange` |
| `<DataPendingNote>` | needs_check 안내 | `message?` |

### 디자인 토큰 (`tailwind.config.ts`)

```ts
extend: {
  colors: {
    ink: {       // 텍스트
      900: '#111',
      700: '#333',
      500: '#666',
      300: '#aaa',
    },
    paper: {     // 배경
      DEFAULT: '#fafafa',
      card: '#fff',
      muted: '#f3f3f3',
    },
    signal: {
      info: '#3b6fb0',          // 파랑 톤 (단순 정보)
      check: '#a86b1f',         // 앰버 톤 (확인 권장, 자극적이지 않게)
      attention: '#7c2b2b',     // 절제된 burgundy (자료 강조)
    },
  },
  fontFamily: {
    sans: ['Pretendard', 'system-ui', '...'],
    mono: ['ui-monospace', '...'],
  },
}
```

## 컴포넌트별 요구사항

### `<SourceLink>`
- props 필수: `href`, `date`
- `href`가 빈 문자열이면 `"원문 링크 없음"` 비활성 표시
- 외부 링크 아이콘 + `target="_blank" rel="noopener noreferrer"`
- 날짜는 `formatSourceDate()`로 표시

### `<NeutralBadge>`
- `variant: 'info' | 'check' | 'high_attention'`
- children이 string일 때만 forbidden-word 검사 (런타임)
  - dev: `throw` / prod: console.warn + 텍스트 대체 `(부적절한 표현)`
- variant별 토큰 색상 사용

### `<DisclosureCard>`
- 4개 서브섹션: 재산 / 납세·체납 / 병역 / 전과
- 각 서브섹션 헤더에 SourceLink 필수
- null/빈값은 `<DataPendingNote>` 컴포넌트로 통일 표시

### `<CrossCheckBlock>`
- PRD §11 권장 문구 패턴만 출력 (자유 텍스트 입력 금지)
- 매칭되는 items가 0개면 컴포넌트 자체 미렌더 (`null` 반환)
- 출력 텍스트는 `assertNoForbiddenWords()` 통과

### `<SortSelector>`
- options는 PRD §3.1 허용 정렬만 (whitelist enum)
- 금지 정렬명은 타입 레벨에서 차단

## 프리뷰 페이지

`app/(dev)/preview/page.tsx` — 모든 도메인 컴포넌트의 상태/케이스를 렌더하는 카탈로그 페이지 (개발 전용). `next.config.ts`에서 prod 빌드시 제외.

## 수용 기준
- [ ] 모든 도메인 컴포넌트가 프리뷰 페이지에서 렌더
- [ ] `<SourceLink>`는 `href` 또는 `date` 누락 시 TS 컴파일 에러
- [ ] `<NeutralBadge>`가 금지어 포함 children 받으면 dev에서 throw
- [ ] 모든 컴포넌트가 모바일 320px 폭에서 깨지지 않음
- [ ] 컬러 컨트라스트 WCAG AA (`signal.*` 색상 vs paper 배경)
- [ ] 컴포넌트 prop 타입에 JSDoc 주석 포함
- [ ] `<DataPendingNote>` 문구가 모든 미입력 케이스에서 동일 (예: `"자료 입력 전입니다. 원문 확인 후 반영됩니다."`)

## 의존
- #1, #2, #3

## Out of scope
- 페이지 구성 (#5~#9)
- 모션/애니메이션 (mock 단계 생략)
- Storybook 도입 (선택)

## 🚨 사람 결정 필요

- [ ] **색 톤 방향**: 그레이스케일 + 단일 액센트 (권장, "건조한 표현"에 부합) vs 다색
- [ ] **severity 컬러 정확값**: 위 예시 hex 그대로 vs 디자이너 검토
- [ ] **`<CrossCheckBlock>` 매칭 룰 위치**: #7에서 결정. 본 이슈에선 인터페이스만 마련.
- [ ] **로고/워드마크**: 텍스트 로고만 (`투표 전 체크`) vs 심볼 디자인 발주
- [ ] **Dark mode 지원 여부**: mock 단계엔 light only 권장
- [ ] **`<DataPendingNote>` 통일 문구**: 권장 `"자료 입력 전입니다. 원문 확인 후 반영됩니다."` vs 다른 표현
- [ ] **Storybook 도입 여부**: 카탈로그 페이지로 갈음 가능
- [ ] **외부 링크 아이콘 스타일**: lucide-react `external-link` (권장) vs custom
- [ ] **모바일 fontSize 기준**: 본문 14px / 15px / 16px 중 — 권장 **15px (한국어 가독성)**
