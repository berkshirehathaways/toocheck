import Link from 'next/link';
import { formatKrwShort } from '@/lib/format-krw';
import { specificityLabel } from '@/lib/promise-specificity';
import type { CompareRow } from '@/types/domain';

export interface CompareTableProps {
  rows: CompareRow[];
}

const COLS = [
  '기호',
  '이름',
  '정당',
  '재산총액',
  '재산 상위',
  '전과 공개',
  '체납 공개',
  '병역',
  '공약 수',
  '공약 구체성 평균',
  '확인 필요도',
] as const;

export function CompareTable({ rows }: CompareTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {COLS.map((c) => (
              <th
                key={c}
                scope="col"
                className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pending = r.candidate.reviewStatus !== 'reviewed';
            return (
              <tr key={r.candidate.id} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2 tabular-nums">{r.candidate.ballotNumber}</td>
                <td className="px-3 py-2 font-medium">
                  <Link
                    href={`/candidates/${r.candidate.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {r.candidate.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{r.candidate.party}</td>
                <td className="px-3 py-2 tabular-nums">
                  {pending ? '—' : formatKrwShort(r.disclosure?.assetTotal ?? null)}
                </td>
                <td className="px-3 py-2 text-xs">
                  {pending ? '—' : r.assetInTopQuintile ? '상위 20%' : '—'}
                </td>
                <td className="px-3 py-2 text-xs">
                  {pending ? '—' : (r.disclosure?.criminalRecords.length ?? 0) > 0 ? '있음' : '없음'}
                </td>
                <td className="px-3 py-2 text-xs">
                  {pending ? '—' : (r.disclosure?.taxArrears.length ?? 0) > 0 ? '있음' : '없음'}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {pending ? '—' : r.disclosure?.militarySummary ?? '공개자료'}
                </td>
                <td className="px-3 py-2 tabular-nums">{pending ? '—' : r.promiseCount}</td>
                <td className="px-3 py-2 text-xs">
                  {pending ? '—' : `${r.avgSpecificity.toFixed(1)} (${specificityLabel(Math.round(r.avgSpecificity))})`}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {pending ? '자료 확인 중' : r.checkPriorityLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
