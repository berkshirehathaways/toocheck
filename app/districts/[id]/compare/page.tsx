import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CompareTable } from '@/components/domain/CompareTable';
import { CompareMobile } from '@/components/domain/CompareMobile';
import { SortSelector } from '@/components/domain/SortSelector';
import { HudLabel, StatusChip, ChipDivider } from '@/components/domain';
import { formatSourceBasis } from '@/lib/format-date';
import { isSortKey, sortCompareRows, type SortKey } from '@/lib/api/sort';
import { getCompareData, getDistrict, getDistrictSourceCheckedAt } from '@/mocks/loader';

import './print.css';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const d = getDistrict(id);
  if (!d) return { title: '지역을 찾을 수 없음' };
  return { title: `${d.name} 후보 비교표` };
}

export default async function ComparePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { sort: sortParam } = await searchParams;
  const district = getDistrict(id);
  if (!district) notFound();
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'ballot';
  const rows = sortCompareRows(getCompareData(id), sort);
  const basis = formatSourceBasis(getDistrictSourceCheckedAt(id));

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-6 space-y-3">
        <StatusChip tone="live">
          <span>비교</span><ChipDivider /><span>{district.name}</span><ChipDivider /><span>기준일 · {basis}</span>
        </StatusChip>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <HudLabel tone="cyan">후보 비교표 · 11항목</HudLabel>
            <h1 className="display-ko mt-2 text-2xl font-bold text-ink">
              {district.name} · 후보 비교표
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <SortSelector basePath={`/districts/${id}/compare`} current={sort} />
          </div>
        </div>
      </header>

      <div className="hidden md:block"><CompareTable rows={rows} /></div>
      <div className="md:hidden"><CompareMobile rows={rows} /></div>

      <div className="label-ko mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-hair pt-5 text-dim print:hidden">
        <Link href={`/districts/${id}`} className="hover:text-cyan">← 후보 목록</Link>
        <Link href="/correction" className="text-cyan hover:underline">정정 요청 →</Link>
      </div>

      <p className="label-ko mt-4 text-dim">
        본 비교표의 모든 정보는 공개자료 기준이며, 자료가 비어 있는 항목은 빈칸으로 둡니다.
      </p>
    </main>
  );
}
