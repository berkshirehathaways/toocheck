import Link from 'next/link';
import { HudLabel, LimeStamp, RegistrationMarks } from '@/components/domain';
import { SITE } from '@/lib/site/config';
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
        <HudLabel tone="cyan">지역 선택</HudLabel>
        <h1 className="display-ko text-4xl font-bold text-ink">지역 선택</h1>
        <p className="text-sm text-ink/75">
          정식 베타 단계에서는 우편번호·주소 검색으로 지역구를 안내합니다.
          현재는 아래 테스트 지역 1곳을 이용해 주세요.
        </p>
      </header>

      <section className="relative hud-panel p-5">
        <RegistrationMarks color="dim" inset={8} />
        <HudLabel tone="dim">우편번호 검색 · 준비 중</HudLabel>
        <h2 className="mt-2 font-ko text-base font-bold text-ink/80">우편번호로 지역 찾기</h2>
        <div aria-disabled className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            inputMode="numeric"
            placeholder="우편번호 5자리"
            disabled
            className="label-ko flex-1 border border-hair bg-bg px-3 py-2 text-ink disabled:cursor-not-allowed disabled:opacity-40"
          />
          <button
            type="button"
            disabled
            className="label-ko-lg border border-hair px-4 py-2 text-dim disabled:cursor-not-allowed"
          >
            검색
          </button>
        </div>
        <p className="label-ko mt-3 text-dim">
          실 데이터 단계에서 도로명·우편번호 기반 매칭으로 연결됩니다.
        </p>
      </section>

      <section className="relative hud-panel p-6">
        <RegistrationMarks color="cyan" inset={8} />
        <div className="absolute -top-3 left-6">
          <LimeStamp rotate={-4}>테스트 지역 · 시연용</LimeStamp>
        </div>
        <HudLabel tone="cyan">샘플 시 가나구청장</HudLabel>
        <h2 className="mt-3 font-ko text-2xl font-bold text-ink">샘플 시 가나구청장</h2>
        <p className="label-ko mt-1 text-dim">2026 지방선거 · 후보 04명</p>
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
        <HudLabel tone="dim">등록된 선거</HudLabel>
        <ul className="label-ko divide-y divide-hair border border-hair text-ink/80">
          {lookups.map(({ election, districts }) => (
            <li key={election.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <span className="text-cyan tabular-nums">{election.electionDate.replace(/-/g, '.')}</span>
              <span className="font-medium text-ink">
                {election.name}
              </span>
              <span className="ml-auto text-dim">지역 {String(districts.length).padStart(2, '0')}곳</span>
              <span className="text-lime">진행 중</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
