import {
  HudLabel,
  RegionSearch,
} from '@/components/domain';
import { listDistricts, listElections } from '@/mocks/loader';

export const metadata = {
  title: '지역 선택',
  description: '내 지역구를 선택해 후보자를 비교해 보세요.',
};

export default function DistrictListPage() {
  const elections = listElections();
  const lookups = elections.map((e) => ({ election: e, districts: listDistricts(e.id) }));

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-6 py-12 sm:py-16">
      <header className="space-y-3">
        <HudLabel tone="cyan">전국 시·군·구 검색 지원</HudLabel>
        <h1 className="display-ko text-4xl font-bold text-ink sm:text-5xl">
          내 지역 후보 찾기
        </h1>
        <p className="text-base leading-relaxed text-ink/75">
          시·군·구 이름만 입력하면 시·도지사·교육감·구청장·시·도의원·구의원 후보를 한 번에 보여줍니다.
          후보를 누르면 공개자료·공약이 담긴 상세 페이지로 이동합니다.
        </p>
      </header>

      <RegionSearch />

      <section className="space-y-2">
        <HudLabel tone="dim">등록된 선거 {elections.length}건</HudLabel>
        <ul className="label-ko divide-y divide-hair border border-hair text-ink/80">
          {lookups.map(({ election, districts }) => (
            <li key={election.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <span className="text-cyan tabular-nums">{election.electionDate.replace(/-/g, '.')}</span>
              <span className="font-medium text-ink">{election.name}</span>
              <span className="ml-auto text-dim">지역 {districts.length}곳</span>
              <span className="text-lime">진행 중</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
