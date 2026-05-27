import { cn } from '@/lib/utils';

export function SpeedLines({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden opacity-50',
        className
      )}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${15 + i * 18}%`,
            background:
              i % 2 === 0
                ? 'linear-gradient(to right, transparent, rgba(6,182,212,0.35) 30%, rgba(6,182,212,0.35) 70%, transparent)'
                : 'linear-gradient(to right, transparent, rgba(190,242,100,0.25) 30%, rgba(190,242,100,0.25) 70%, transparent)',
            transform: `translateX(${(i % 2) * 16 - 8}px)`,
          }}
        />
      ))}
    </div>
  );
}
