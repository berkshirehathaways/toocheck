import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CandidateCard } from '@/components/domain';
import { SortSelector } from '@/components/domain/SortSelector';
import { formatSourceBasis } from '@/lib/format-date';
import { isSortKey, sortCompareRows, type SortKey } from '@/lib/api/sort';
import {
  getCompareData,
  getDistrict,
  getDistrictSourceCheckedAt,
  getElection,
  listPromises,
} from '@/mocks/loader';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const d = getDistrict(id);
  if (!d) return { title: '지역을 찾을 수 없음' };
  return {
    title: `${d.name} 후보 목록`,
    description: `${d.name}의 후보 정보 비교 — 공개자료 기준`,
  };
}

export default async function DistrictPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { sort: sortParam } = await searchParams;
  const district = getDistrict(id);
  if (!district) notFound();

  const election = getElection(district.electionId);
  const sort: SortKey = isSortKey(sortParam) ? sortParam : 'ballot';
  const rows = sortCompareRows(getCompareData(id), sort);
  const basisDate = formatSourceBasis(getDistrictSourceCheckedAt(id));

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
              {election?.name ?? '선거'}
            </p>
            <h1 className="text-xl font-semibold tracking-tight">{district.name}</h1>
            <p className="text-xs text-muted-foreground">{basisDate}</p>
          </div>
          <SortSelector basePath={`/districts/${id}`} current={sort} />
        </div>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        {district.description ?? '본 화면의 후보 정보는 공개자료 기준이며, 자료가 비어 있는 항목은 빈칸으로 둡니다.'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => {
          const top = listPromises(row.candidate.id)
            .slice()
            .sort((a, b) => b.specificityScore - a.specificityScore || a.orderNo - b.orderNo)
            .slice(0, 2);
          return (
            <CandidateCard
              key={row.candidate.id}
              candidate={row.candidate}
              row={row}
              topPromises={top}
            />
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <Link href={`/districts/${id}/compare`} className="underline-offset-2 hover:underline">
          후보 비교표 보기 →
        </Link>
        <Link href="/correction" className="underline-offset-2 hover:underline">
          자료에 오류가 있다면 정정 요청
        </Link>
      </div>
    </main>
  );
}
