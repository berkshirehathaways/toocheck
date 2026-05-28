import {
  DistrictLookupPanel,
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
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="space-y-2">
        <HudLabel tone="cyan">전국 시·군·구 검색 지원</HudLabel>
        <h1 className="display-ko text-4xl font-bold text-ink">지역 선택</h1>
        <p className="text-sm text-ink/75">
          시·군·구만 입력하면 시·도지사·교육감·구청장·시·도의원·구의원 후보를 한 번에 보여줍니다.
          정확한 시·도의원·구의원 선거구까지 좁히려면 아래에서 주소로 검색하세요.
        </p>
      </header>

      <RegionSearch />

      <details className="hud-panel p-5">
        <summary className="label-ko cursor-pointer text-cyan">
          주소로 정확한 선거구까지 찾기 (선택)
        </summary>
        <div className="mt-4">
          <DistrictLookupPanel />
        </div>
      </details>

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
