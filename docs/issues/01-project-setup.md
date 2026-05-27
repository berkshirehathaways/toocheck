# [#1] 프로젝트 세팅

## 목적
모든 이슈의 토대가 되는 Next.js + TS + Tailwind + shadcn/ui 스캐폴드를 생성한다.

> 참조: PRD §14.1, §20.1

## 산출물

### 루트 파일
- `package.json` — Node 20 LTS, scripts: `dev`/`build`/`start`/`lint`/`typecheck`/`format`
- `tsconfig.json` — `strict: true`, path alias `"@/*": ["./*"]`
- `next.config.ts` — `reactStrictMode: true`, `images.remotePatterns` 빈 배열
- `tailwind.config.ts`, `postcss.config.mjs`
- `.eslintrc.cjs`, `.prettierrc`, `.prettierignore`
- `.editorconfig`, `.nvmrc`
- `.gitignore` (Next.js + IDE + `.env*.local` 포함)
- `README.md` — 실행 방법, 디렉토리 구조 설명

### app/
- `app/layout.tsx` — `<html lang="ko">`, viewport meta, metadata 기본값(title/description/openGraph)
- `app/page.tsx` — placeholder ("프로젝트 세팅 완료" 정도)
- `app/globals.css` — Tailwind 3 layers + CSS variables

### components/ui/
- shadcn CLI로 추가: `button`, `card`, `badge`

### lib/
- `lib/utils.ts` — shadcn `cn()` 유틸

## 디렉토리 구조 (이 이슈 완료 시점 기준)

```
toocheck/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ui/                    # shadcn primitives
├── lib/
│   └── utils.ts
├── public/
├── docs/
│   └── issues/                # 본 이슈 모음
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── .nvmrc
└── README.md
```

이후 이슈들이 추가할 디렉토리: `types/`, `mocks/`, `components/domain/`, `app/(public)/`, `app/api/`, `__tests__/`.

## 구현 가이드

1. `pnpm dlx create-next-app@latest toocheck-tmp --ts --tailwind --eslint --app --src-dir=false --use-pnpm --import-alias "@/*"` 출력 결과를 이 레포에 머지 (또는 수동 세팅)
2. `pnpm dlx shadcn@latest init` — `New York` 스타일, base color `slate`, CSS variables 사용
3. `pnpm dlx shadcn@latest add button card badge`
4. `tsconfig.json`에 `"strict": true`, `"noUncheckedIndexedAccess": true` 확인
5. `.eslintrc.cjs`에 `@typescript-eslint/no-floating-promises`, `react/jsx-key` 활성화

## 수용 기준

- [ ] `pnpm install` 후 `pnpm dev` 로 `http://localhost:3000` 진입 시 한국어 placeholder 페이지 표시
- [ ] `pnpm typecheck` 0 에러
- [ ] `pnpm lint` 0 에러/경고
- [ ] `components/ui/button.tsx`, `card.tsx`, `badge.tsx` 존재
- [ ] `<html lang="ko">` 적용
- [ ] 모바일 viewport meta (`width=device-width, initial-scale=1`)
- [ ] README.md 에 실행 방법 + 디렉토리 구조 문서화

## 의존
- 없음 (선행 이슈)

## Out of scope
- DB / Prisma / Drizzle (mock 단계)
- 인증
- 배포 (Vercel) 설정
- i18n (한국어 단일)

## 🚨 사람 결정 필요

- [ ] **패키지 매니저**: `npm` / `pnpm` / `bun` 중 선택
  - 권장: **pnpm** (shadcn 친화, monorepo 확장 시 유리, lockfile 안정)
- [ ] **Tailwind 버전**: v3 (안정, shadcn 호환 확실) vs v4 (최신, breaking change 다수)
  - 권장: **v3** (shadcn 호환성, 학습 자료 풍부)
- [ ] **폰트**: 시스템 폰트만 / Pretendard 자체 호스팅 / Google Fonts(Noto Sans KR)
  - 권장: **Pretendard via CDN or self-host** (한국어 가독성, 라이선스 OFL)
- [ ] **Node 버전**: 20 LTS 권장 — `.nvmrc`에 명시할 정확한 패치 버전
- [ ] **pre-commit hook**: Husky + lint-staged 도입 여부 (mock 단계엔 생략 가능)
- [ ] **레포지토리 라이선스**: MIT / 비공개 / 미정
- [ ] **`src/` 디렉토리 사용 여부**: 권장 **미사용** (현재 구조 단순)
