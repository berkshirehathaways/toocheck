import { cn } from '@/lib/utils';

// 결정 E6: 통일 문구
export const DATA_PENDING_MESSAGE = '자료 입력 전입니다. 원문 확인 후 반영됩니다.';

export function DataPendingNote({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'rounded-md border border-dashed border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground',
        className
      )}
    >
      {DATA_PENDING_MESSAGE}
    </p>
  );
}
