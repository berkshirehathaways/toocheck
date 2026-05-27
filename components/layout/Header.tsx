import Link from 'next/link';
import { SITE } from '@/lib/site/config';

const NAV = [
  { href: '/districts', en: 'DISTRICTS', ko: '지역' },
  { href: '/principles', en: 'PRINCIPLES', ko: '원칙' },
  { href: '/correction', en: 'CORRECTION', ko: '정정' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hair bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span aria-hidden className="block h-2.5 w-2.5 bg-lime shadow-[0_0_8px_rgba(190,242,100,0.7)]" />
          <span className="display-en text-xl tracking-[0.15em] text-ink">
            TOOCHECK<span className="text-cyan">.SITE</span>
          </span>
          <span className="mono mono-9 hidden text-dim sm:inline">투표 전 체크</span>
        </Link>

        <nav aria-label="primary">
          <ul className="flex items-center gap-5">
            {NAV.map((n) => (
              <li key={n.en}>
                <Link
                  href={n.href}
                  className="mono mono-10 group flex flex-col items-center text-ink/60 transition-colors hover:text-ink"
                >
                  <span className="group-hover:text-cyan">{n.en}</span>
                  <span className="mono mono-9 text-dim opacity-0 transition-opacity group-hover:opacity-100">{n.ko}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <span className="mono mono-10 text-dim">// HOME</span>
          <Link
            href="/correction"
            className="mono mono-10 inline-flex items-center gap-1 border border-cyan/50 px-2.5 py-1.5 text-cyan transition-colors hover:bg-cyan hover:text-bg"
          >
            정정 요청 →
          </Link>
        </div>
      </div>
    </header>
  );
}
