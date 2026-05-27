import { cn } from '@/lib/utils';

export const DATA_PENDING_MESSAGE = '자료 입력 전입니다. 원문 확인 후 반영됩니다.';

export function DataPendingNote({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mono mono-10 flex items-center gap-3 border border-dashed border-hair bg-bg-elev px-3 py-2.5 text-dim',
        className
      )}
    >
      <span aria-hidden className="block h-1.5 w-1.5 bg-white/30" />
      <span className="normal-case tracking-normal text-[12px] text-ink/70" style={{ letterSpacing: 0 }}>
        {DATA_PENDING_MESSAGE}
      </span>
    </div>
  );
}
