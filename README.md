# 투표 전 체크 · Toocheck

공개자료를 바탕으로 후보자 정보를 비교해 보여주는 비당파 도구. mock-first localhost MVP.

- 서비스: <https://toocheck.site>
- 운영: 토체크팀 · <contact@alphaview.kr>
- 결정 동결: [`docs/prd-addendum.md`](./docs/prd-addendum.md), [이슈 #13](https://github.com/shaun0927/toocheck/issues/13)

## 실행

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm typecheck
pnpm lint
pnpm build && pnpm start
```

Node 20.18.0 LTS 권장 (`.nvmrc` 참고). pnpm 9.x 권장.

## 디렉토리 구조

```
toocheck/
├── app/                  # Next.js App Router 라우트
├── components/
│   ├── ui/               # shadcn primitives (button, card, badge, ...)
│   └── domain/           # 도메인 컴포넌트 (NeutralBadge, CheckCard 등) — #4
├── lib/                  # 유틸 (cn, forbidden-words, format-* ...) — #3
├── mocks/                # 시드 데이터 + loader — #2
├── types/                # 도메인 타입 — #2
├── public/               # 정적 자산
└── docs/                 # 이슈 분할안 + PRD addendum
```

## 작업 이슈

`docs/issues/README.md` 참조. Phase 0 (#1~#3) 직렬 → Phase 1 (#4 후 #5~#9·#11 병렬) → Phase 2 (#10·#12).

## QA

- `pnpm test` — vitest 단위테스트 (lib/* + loader + sort)
- `pnpm check:forbidden` — 시드 텍스트가 forbidden-words 사전 통과 확인
- `pnpm e2e` — Playwright 골든 패스 (랜딩 → 후보 목록 → 상세 → 비교 → 정정 요청)
  - 최초 1회 `pnpm exec playwright install --with-deps chromium` 필요
- Lighthouse 목표 (모바일): **Performance 80 / Accessibility 90**

## 라이선스

미정 (레포 private 유지, public 전환 시점 재검토 — 결정 [A5](https://github.com/shaun0927/toocheck/issues/13#a5)).
