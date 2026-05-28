import { cn } from '@/lib/utils';

interface HudLabelProps {
  children: React.ReactNode;
  tone?: 'cyan' | 'lime' | 'dim';
  lang?: 'ko' | 'en';
  as?: 'span' | 'div' | 'h2' | 'h3';
  className?: string;
}

const SQ: Record<NonNullable<HudLabelProps['tone']>, string> = {
  cyan: 'bg-cyan',
  lime: 'bg-lime',
  dim: 'bg-white/30',
};

/**
 * lang='ko' (default): Pretendard 11px, 자연스러운 한국어 라벨
 * lang='en': mono uppercase 10px, 영문 HUD 코드
 */
export function HudLabel({
  children, tone = 'cyan', lang = 'ko', as: As = 'span', className,
}: HudLabelProps) {
  const text = lang === 'en' ? 'mono mono-10' : 'label-ko';
  return (
    <As
      className={cn('inline-flex items-center gap-2 text-dim', text, className)}
    >
      <span aria-hidden className={cn('block h-1.5 w-1.5', SQ[tone])} />
      <span>{children}</span>
    </As>
  );
}
