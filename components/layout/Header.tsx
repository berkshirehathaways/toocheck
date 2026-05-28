import Link from 'next/link';
import { SITE } from '@/lib/site/config';

const NAV = [
  { href: '/districts', label: '지역 선택' },
  { href: '/principles', label: '서비스 원칙' },
  { href: '/correction', label: '정정 요청' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-3">
          <span aria-hidden className="block h-2.5 w-2.5 bg-lime shadow-[0_0_8px_rgba(190,242,100,0.7)]" />
          <span className="display-ko text-xl font-extrabold tracking-tight text-ink">
            투체크
          </span>
          <span className="label-ko hidden text-dim sm:inline">투표 전 체크</span>
        </Link>

        <nav aria-label="주요 메뉴">
          <ul className="flex items-center gap-5">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="label-ko text-ink/70 transition-colors hover:text-cyan"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="label-ko text-dim">지금 위치 · 홈</span>
          <Link
            href="/correction"
            className="label-ko-lg inline-flex items-center gap-1 border border-cyan/50 px-3 py-1.5 text-cyan transition-colors hover:bg-cyan hover:text-bg"
          >
            정정 요청 →
          </Link>
        </div>
      </div>
    </header>
  );
}
