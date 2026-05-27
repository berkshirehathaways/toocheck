import Link from 'next/link';
import { SITE } from '@/lib/site/config';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground">
        <p className="leading-relaxed text-foreground/80">{SITE.disclaimerLong}</p>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{SITE.team}</span>
            <span>·</span>
            <a
              href={`mailto:${SITE.contactEmail}`}
              className="underline-offset-2 hover:underline"
              aria-label={`운영자에게 문의 (${SITE.contactEmail})`}
            >
              운영자에게 문의
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/principles" className="hover:text-foreground">
              서비스 원칙
            </Link>
            <Link href="/correction" className="hover:text-foreground">
              정정 요청
            </Link>
            <span>{SITE.domain}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
