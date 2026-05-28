import Link from 'next/link';
import {
  DistrictLookupPanel,
  HudLabel,
  LimeStamp,
  RegionSearch,
  RegistrationMarks,
} from '@/components/domain';
import { SITE } from '@/lib/site/config';
import { listCandidates, listDistricts, listElections } from '@/mocks/loader';

export const metadata = {
  title: '지역 선택',
  description: '내 지역구를 선택해 후보자를 비교해 보세요.',
};

export default function DistrictListPage() {
  const elections = listElections();
  const lookups = elections.map((e) => ({ election: e, districts: listDistricts(e.id) }));
  const totalDistricts = lookups.reduce((a, x) => a + x.districts.length, 0);
  const sampleCandCount = listCandidates(SITE.testDistrictId).length;

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

      <section className="relative hud-panel p-6">
        <RegistrationMarks color="cyan" inset={8} />
        <div className="absolute -top-3 left-6">
          <LimeStamp rotate={-4}>시연용 가상 데이터</LimeStamp>
        </div>
        <HudLabel tone="cyan">후보 {sampleCandCount}명 등록 · 2026 지방선거</HudLabel>
        <h2 className="mt-3 font-ko text-2xl font-bold text-ink">샘플 시 가나구청장</h2>
        <p className="label-ko mt-1 text-dim">
          공약 비교 · 공개자료 · 함께 확인할 지점까지 한 화면에서 살펴봅니다.
        </p>
        <Link
          href={`/districts/${SITE.testDistrictId}`}
          className="label-ko-lg mt-5 inline-flex items-center gap-2 border border-cyan bg-cyan px-5 py-3 text-bg transition-colors hover:bg-ink hover:border-ink"
        >
          살펴보기 →
        </Link>
        <p className="mt-4 text-xs text-ink/60">
          본 지역 및 후보 정보는 시연용 가상 데이터입니다. 실제 지역구·후보·정당과 무관합니다.
        </p>
      </section>

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
