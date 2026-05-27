import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CompareTable } from '@/components/domain/CompareTable';
import { CompareMobile } from '@/components/domain/CompareMobile';
import { SortSelector } from '@/components/domain/SortSelector';
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
  return {
    title: `${d.name} 후보 비교표`,
    description: `${d.name}의 후보 11개 항목 비교 — 공개자료 기준`,
  };
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
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">compare</p>
          <h1 className="text-xl font-semibold tracking-tight">{district.name} · 후보 비교표</h1>
          <p className="text-xs text-muted-foreground">{basis}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <SortSelector basePath={`/districts/${id}/compare`} current={sort} />
        </div>
      </header>

      <div className="hidden md:block">
        <CompareTable rows={rows} />
      </div>
      <div className="md:hidden">
        <CompareMobile rows={rows} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground print:hidden">
        <Link href={`/districts/${id}`} className="hover:text-foreground">
          ← 후보 목록으로
        </Link>
        <Link href="/correction" className="underline-offset-2 hover:underline">
          자료에 오류가 있다면 정정 요청
        </Link>
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        본 비교표의 모든 정보는 공개자료 기준이며, 자료가 비어 있는 항목은 빈칸으로 둡니다.
      </p>
    </main>
  );
}
