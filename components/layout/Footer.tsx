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

      <div className="mx-auto mt-6 flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 pb-10">
        <p className="label-ko text-dim">
          © {SITE.team} · 2026 · 공개자료 기반 운영
        </p>
        <p className="label-ko text-dim">
          <span>{SITE.domain}</span>
          <span aria-hidden className="mx-2 text-ink/25">·</span>
          <a href={`mailto:${SITE.contactEmail}`} className="text-cyan hover:underline">
            {SITE.contactEmail}
          </a>
        </p>
      </div>
    </footer>
  );
}
