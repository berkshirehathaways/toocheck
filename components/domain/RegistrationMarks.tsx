import { cn } from '@/lib/utils';

interface RegistrationMarksProps {
  size?: number;
  inset?: number;
  color?: 'cyan' | 'lime' | 'dim';
  className?: string;
}

const COLOR_CLS: Record<NonNullable<RegistrationMarksProps['color']>, string> = {
  cyan: 'border-cyan',
  lime: 'border-lime',
  dim: 'border-white/30',
};

export function RegistrationMarks({
  size = 12,
  inset = 8,
  color = 'cyan',
  className,
}: RegistrationMarksProps) {
  const stroke = COLOR_CLS[color];
  const styles = (corner: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      width: size,
      height: size,
      borderColor: 'currentColor',
      position: 'absolute',
    };
    if (corner === 'tl') return { ...base, top: inset, left: inset, borderTopWidth: 1, borderLeftWidth: 1 };
    if (corner === 'tr') return { ...base, top: inset, right: inset, borderTopWidth: 1, borderRightWidth: 1 };
    if (corner === 'bl') return { ...base, bottom: inset, left: inset, borderBottomWidth: 1, borderLeftWidth: 1 };
    return { ...base, bottom: inset, right: inset, borderBottomWidth: 1, borderRightWidth: 1 };
  };
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 select-none text-cyan', stroke, className)}
    >
      <span style={styles('tl')} />
      <span style={styles('tr')} />
      <span style={styles('bl')} />
      <span style={styles('br')} />
    </div>
  );
}
