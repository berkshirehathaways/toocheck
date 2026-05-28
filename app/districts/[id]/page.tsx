import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  CandidateCard,
  ChipDivider,
  StatusChip,
} from '@/components/domain';
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
  const basis = formatSourceBasis(getDistrictSourceCheckedAt(id));

  return (
    <main className="mx-auto max-w-6xl px-6 py-6">
      <div className="sticky top-14 z-30 -mx-6 mb-6 border-b border-hair bg-bg/90 px-6 py-4 backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <StatusChip tone="live">
              <span>후보 {rows.length}명</span>
              <ChipDivider />
              <span>{election?.name}</span>
              <ChipDivider />
              <span>기준일 · {basis}</span>
            </StatusChip>
            <h1 className="font-ko text-2xl font-bold text-ink">
              {district.name}
            </h1>
          </div>
          <SortSelector basePath={`/districts/${id}`} current={sort} />
        </div>
      </div>

      <p className="label-ko mb-5 text-dim">
        {district.description ?? '본 화면의 모든 정보는 공개자료 기준이며, 자료가 비어 있는 항목은 빈칸으로 둡니다.'}
      </p>

      <div className="grid gap-px bg-hair sm:grid-cols-2 lg:grid-cols-3">
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
              basisDate={basis}
              className="border-0"
            />
          );
        })}
      </div>

      <div className="label-ko mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-hair pt-6 text-dim">
        <Link href="/districts" className="hover:text-cyan">← 다른 지역 선택</Link>
        <Link href={`/districts/${id}/compare`} className="text-cyan hover:underline">
          후보 비교표 보기 →
        </Link>
        <Link href="/correction" className="hover:text-cyan">정정 요청 →</Link>
      </div>
    </main>
  );
}
