import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// 결정 E22: lucide-react external-link
export interface SourceLinkProps {
  href: string;
  children?: React.ReactNode;
  basisDate?: string; // "2026년 5월 20일 기준" 등 동반 라벨
  className?: string;
}

export function SourceLink({ href, children = '원문 자료 보기', basisDate, className }: SourceLinkProps) {
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1 text-xs', className)}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1 text-foreground underline-offset-2 hover:underline"
      >
        {children}
        <ExternalLink className="h-3 w-3" aria-hidden />
        <span className="sr-only">(새 창)</span>
      </a>
      {basisDate ? (
        <span className="text-muted-foreground">· {basisDate}</span>
      ) : null}
    </span>
  );
}
