import { SITE } from '@/lib/site/config';
import { PhaseMap } from '@/components/domain/PhaseMap';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-hair bg-bg">
      <div className="mx-auto max-w-7xl px-6 pt-10">
        <div className="border border-hair bg-bg-elev px-5 py-4 text-sm">
          <p className="leading-relaxed text-ink/80">{SITE.disclaimerLong}</p>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl px-6">
        <PhaseMap />
      </div>

      <div className="mx-auto mt-6 max-w-7xl px-6 pb-10">
        <p className="mono mono-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-dim">
          <span>© {SITE.team} // 2026</span>
          <span aria-hidden>·</span>
          <span>BUILT FROM PUBLIC SOURCES</span>
          <span aria-hidden>·</span>
          <span>{SITE.domain}</span>
          <span aria-hidden>·</span>
          <a
            href={`mailto:${SITE.contactEmail}`}
            className="text-cyan hover:underline"
          >
            {SITE.contactEmail}
          </a>
        </p>
      </div>
    </footer>
  );
}
