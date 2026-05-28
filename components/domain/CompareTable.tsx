import Link from 'next/link';
import { formatKrwShort } from '@/lib/format-krw';
import { specificityLabel } from '@/lib/promise-specificity';
import type { CompareRow } from '@/types/domain';
import { NeutralBadge } from './NeutralBadge';

export interface CompareTableProps {
  rows: CompareRow[];
}

const COLS = [
  '기호', '이름', '정당', '재산총액', '재산 상위', '전과 공개',
  '체납 공개', '병역', '공약 수', '구체성 평균', '확인 필요도',
] as const;

export function CompareTable({ rows }: CompareTableProps) {
  return (
    <div className="hud-panel overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hair bg-bg-elev">
            {COLS.map((c) => (
              <th
                key={c}
                scope="col"
                className="label-ko px-3 py-3 text-left text-dim"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const pending = r.candidate.reviewStatus !== 'reviewed';
            return (
              <tr
                key={r.candidate.id}
                className={
                  'border-b border-hair-soft last:border-b-0 transition-colors hover:bg-cyan/[0.04] ' +
                  (i % 2 === 1 ? 'bg-white/[0.015]' : '')
                }
              >
                <td className="label-ko px-3 py-3 text-cyan tabular-nums">
                  기호 {r.candidate.ballotNumber}
                </td>
                <td className="px-3 py-3 font-ko font-medium">
                  <Link
                    href={`/candidates/${r.candidate.id}`}
                    className="text-ink underline-offset-2 hover:underline"
                  >
                    {r.candidate.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-dim">{r.candidate.party}</td>
                <td className="px-3 py-3 tabular-nums text-ink/85">
                  {pending ? '—' : formatKrwShort(r.disclosure?.assetTotal ?? null)}
                </td>
                <td className="label-ko px-3 py-3">
                  {pending ? '—' : r.assetInTopQuintile ? <span className="text-[#e0b075]">상위 20%</span> : '—'}
                </td>
                <td className="label-ko px-3 py-3">
                  {pending ? '—' : (r.disclosure?.criminalRecords.length ?? 0) > 0 ? <span className="text-[#e0b075]">있음</span> : <span className="text-dim">없음</span>}
                </td>
                <td className="label-ko px-3 py-3">
                  {pending ? '—' : (r.disclosure?.taxArrears.length ?? 0) > 0 ? <span className="text-[#e0b075]">있음</span> : <span className="text-dim">없음</span>}
                </td>
                <td className="px-3 py-3 text-xs text-dim">
                  {pending ? '—' : r.disclosure?.militarySummary ?? '공개자료'}
                </td>
                <td className="px-3 py-3 tabular-nums">{pending ? '—' : r.promiseCount}</td>
                <td className="px-3 py-3 text-xs">
                  {pending ? '—' : `${r.avgSpecificity.toFixed(1)} · ${specificityLabel(Math.round(r.avgSpecificity))}`}
                </td>
                <td className="px-3 py-3 text-xs text-dim">
                  {pending ? <NeutralBadge tone="muted">자료 확인 중</NeutralBadge> : r.checkPriorityLabel}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
