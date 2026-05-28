import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SourceLinkProps {
  href: string;
  children?: React.ReactNode;
  basisDate?: string;
  className?: string;
}

export function SourceLink({ href, children = '원문 자료 보기', basisDate, className }: SourceLinkProps) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-2 text-xs', className)}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="label-ko inline-flex items-center gap-1 border border-hair px-2.5 py-1.5 text-cyan transition-colors hover:bg-cyan/10"
      >
        <span>{children}</span>
        <ExternalLink className="h-3 w-3" aria-hidden />
        <span className="sr-only">(새 창)</span>
      </a>
      {basisDate ? (
        <span className="label-ko text-dim">· {basisDate}</span>
      ) : null}
    </span>
  );
}
