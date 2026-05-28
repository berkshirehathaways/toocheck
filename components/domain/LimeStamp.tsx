import { cn } from '@/lib/utils';

interface LimeStampProps {
  children: React.ReactNode;
  rotate?: number; // degrees, default -4
  className?: string;
}

/** Tilted lime stamp — used for operational status (검수, 출처, 수정), never to praise a candidate. */
export function LimeStamp({ children, rotate = -4, className }: LimeStampProps) {
  return (
    <span
      className={cn(
        'mono mono-10 inline-block bg-lime px-2.5 py-1 font-medium text-bg shadow-[0_2px_6px_rgba(190,242,100,0.2)]',
        className
      )}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
