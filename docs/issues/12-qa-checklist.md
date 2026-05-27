# [#12] 출시 전 QA 체크리스트 & 자동화 테스트

## 목적
PRD §20.7 품질 확인 항목을 **PR 머지 차단 가능한 자동 체크**로 변환. mock 단계라도 회귀 방지.

> 참조: PRD §20.7, §16, §17

## 산출물

```
vitest.config.ts
__tests__/
├── lib/                          # #3에서 작성한 단위 테스트들이 여기에 모임
├── api/                          # API route 핸들러 테스트
└── components/                   # 컴포넌트 스냅샷 (선택)

scripts/
├── check-forbidden.ts             # 시드/소스 전체 금지어 검사
├── check-source-links.ts          # sourceUrl HEAD 체크 (실데이터 단계)
└── audit-display-balance.ts       # 후보별 항목 균형 검사

playwright.config.ts (선택)
e2e/
└── golden-path.spec.ts

.github/
└── pull_request_template.md
```

## 자동 테스트

### Unit (vitest)
- `lib/*` 모든 함수 (#3에서 작성됨)
- API route 핸들러 (#11)
- 컴포넌트 스냅샷 (선택, snap 흔들림 주의)

### 시드 검사 스크립트

```bash
pnpm check:forbidden      # scripts/check-forbidden.ts
pnpm check:balance        # scripts/audit-display-balance.ts
pnpm check:source-links   # mock 단계엔 skip
```

**`scripts/check-forbidden.ts`**:
- `mocks/seed.ts` 내 모든 문자열 + `app/**/*.{tsx,ts}` 내 하드코딩 문자열 스캔
- `findForbiddenWords()` 적용
- 발견 시 exit 1

**`scripts/audit-display-balance.ts`**:
- District 내 모든 후보가 같은 필드 셋을 갖는지 검사 (PRD §16.2 "동일 형식")
- needs_check 후보는 제외
- 누락 항목 발견 시 warning

### E2E (Playwright, 선택)

`e2e/golden-path.spec.ts`:
1. `/` → 랜딩 진입, CTA 노출
2. `테스트 지역으로 보기` 클릭 → 후보 목록 4명 표시
3. 정렬 변경 (재산 높은 순) → URL `?sort=asset_desc`
4. 후보 1 상세 진입 → 공개정보/공약/CrossCheck 섹션 노출
5. 정정 요청 진입 → 폼 자동 prefill 확인
6. 폼 제출 → thank-you 페이지 도달
7. 비교표 진입 → 정렬 가능
8. 공유 카드 진입 → 미리보기 노출, 후보명 비공개 기본

`e2e/forbidden-words.spec.ts`:
- 주요 페이지 5개 본문에 §17 금지어 0건

## PR 템플릿

```markdown
## 변경 요약


## PRD 매핑
- §X.Y

## 수동 QA 체크
- [ ] 모바일 320~430px 반응형
- [ ] 금액 단위 (원/만/억) 표시 일관
- [ ] 원문 링크 새 탭 + `rel="noopener noreferrer"`
- [ ] 공개자료 미입력 항목은 "공개자료 없음" 통일 표기
- [ ] 정렬 기본값 = 기호순
- [ ] 정정 요청 폼 동작
- [ ] 공유 카드 한글 깨짐 없음 + 후보명 비공개 기본

## 자동 체크
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm check:forbidden`
- [ ] `pnpm check:balance`
```

## CI (선택)

`.github/workflows/ci.yml` (도입 시):
- Node 20
- `pnpm install --frozen-lockfile`
- typecheck / lint / test / check:forbidden 병렬 실행

## 수용 기준
- [ ] `pnpm test` 통과
- [ ] `pnpm check:forbidden` 통과
- [ ] PR 템플릿 활성화 (`.github/pull_request_template.md`)
- [ ] mock 단계에선 CI 미도입도 무방, 로컬 스크립트 가능
- [ ] Lighthouse 모바일 Perf ≥ 80, A11y ≥ 90 (수동 1회 측정 + README에 기록)

## 의존
- #1, #2, #3, #11

## Out of scope
- 부하 테스트
- 보안 펜테스트
- 실데이터 검수

## 🚨 사람 결정 필요

- [ ] **테스트 러너**: **vitest** (권장, ESM 친화, Next.js 호환) vs jest vs bun test
- [ ] **E2E 도입 시점**: 본 이슈에 포함 / 후속 / 생략
  - 권장: **본 이슈에 골든 패스 1개만 포함**, 나머지는 후속
- [ ] **CI 도입**: GitHub Actions 추가 vs 로컬 스크립트만
  - 권장: mock 단계엔 **로컬만**, 실데이터 단계에서 CI 도입
- [ ] **Lighthouse 목표 점수**: Perf 80 / A11y 90 (권장) vs 더 높게
- [ ] **컴포넌트 스냅샷 테스트**: 도입 vs 생략(권장, mock 단계엔 흔들림 비용↑)
- [ ] **`check:source-links`**: 본 이슈에 포함 vs 실데이터 단계로 연기 (권장)
- [ ] **PR 템플릿 강제도**: 자동 체크박스 검증 (GitHub Actions) vs 수동
- [ ] **시각 회귀 테스트**: 도입 (chromatic 등) vs 생략 (권장, 비용↑)
