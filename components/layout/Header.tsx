import Link from 'next/link';
import { SITE } from '@/lib/site/config';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight">{SITE.nameKo}</span>
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {SITE.nameEn}
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/districts" className="hover:text-foreground">
            지역 선택
          </Link>
          <Link href="/principles" className="hover:text-foreground">
            서비스 원칙
          </Link>
        </nav>
      </div>
    </header>
  );
}
