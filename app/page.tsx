import Link from 'next/link';
import {
  CandidateCard,
  ChipDivider,
  HudLabel,
  NeutralBadge,
  RegistrationMarks,
  SpeedLines,
  StatusChip,
} from '@/components/domain';
import { SITE } from '@/lib/site/config';
import {
  getCompareData,
  getDistrict,
  listDistricts,
  listElections,
  listPromises,
  getDistrictSourceCheckedAt,
} from '@/mocks/loader';
import { formatSourceBasis } from '@/lib/format-date';
import { formatKrwShort } from '@/lib/format-krw';

export default function HomePage() {
  const elections = listElections();
  const election = elections[0];
  const featuredId = SITE.featuredDistrictId;
  const featured = getDistrict(featuredId);
  const featuredName = featured?.name ?? '대표 선거구';
  const districtCount = election ? listDistricts(election.id).length : 0;
  const rows = getCompareData(featuredId);
  const basis = formatSourceBasis(getDistrictSourceCheckedAt(featuredId));

  return (
    <main className="relative overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative border-b border-hair bg-bg">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-30" />
        <SpeedLines />
        <div className="relative mx-auto grid max-w-7xl items-start gap-12 px-6 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          {/* LEFT — headline */}
          <div className="flex flex-col">
            <StatusChip tone="live">
              <span>NEC 공개자료</span>
              <ChipDivider />
              <span>{election?.name ?? '2026 지방선거'}</span>
              <ChipDivider />
              <span>전국 {districtCount.toLocaleString()}곳</span>
            </StatusChip>

            <h1 className="mt-8 display-ko text-[clamp(44px,7vw,88px)] font-extrabold leading-[1.05] tracking-tight text-ink">
              당신의 후보는,
              <br />
              어떤{' '}
              <span className="lime-block">사람</span>
              입니까?
            </h1>

            {/* Brand signature */}
            <div className="mt-8 flex items-center gap-3">
              <span
                aria-hidden
                className="block h-1.5 w-1.5 bg-lime shadow-[0_0_8px_rgba(190,242,100,0.7)]"
              />
              <p className="display-ko text-lg font-bold tracking-tight text-ink/90 sm:text-xl">
                투표 전 체크, 투체크
              </p>
            </div>

            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink/70">
              {SITE.disclaimerLong}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/districts"
                className="label-ko-lg inline-flex items-center justify-center gap-2 border border-ink bg-ink px-5 py-3 text-bg transition-colors hover:bg-cyan hover:border-cyan"
              >
                내 지역 후보 확인하기 →
              </Link>
              <Link
                href={`/districts/${featuredId}`}
                className="label-ko-lg inline-flex items-center justify-center gap-2 border border-hair px-5 py-3 text-ink/85 transition-colors hover:border-cyan hover:text-cyan"
              >
                {featuredName} 미리보기 ►
              </Link>
            </div>

            <p className="label-ko mt-6 text-dim">
              모든 후보 정보는 중앙선거관리위원회 공개자료에 기반합니다.
            </p>
          </div>

          {/* RIGHT — live sample data instrument */}
          <div className="relative">
            <div className="relative flex h-full flex-col hud-panel p-6">
              <RegistrationMarks color="cyan" size={14} inset={12} />

              <header className="flex items-baseline justify-between">
                <HudLabel tone="cyan">미리보기</HudLabel>
                <span className="label-ko text-dim">{basis}</span>
              </header>

              <p className="display-ko mt-3 text-3xl font-bold leading-tight text-ink">
                {featuredName}
              </p>
              <p className="label-ko mt-1 text-dim">{election?.name} · 후보 {rows.length}명</p>

              <ul className="mt-6 divide-y divide-hair-soft border-y border-hair-soft">
                {rows.map((r) => {
                  const pending = r.candidate.reviewStatus !== 'reviewed';
                  const hasCrime = (r.disclosure?.criminalRecords.length ?? 0) > 0;
                  const hasTax = (r.disclosure?.taxArrears.length ?? 0) > 0;
                  const sigs = [hasCrime ? '전과 공개' : null, hasTax ? '체납 공개' : null].filter(Boolean);
                  return (
                    <li key={r.candidate.id} className="py-3">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                        <span className="label-ko shrink-0 text-cyan">
                          기호 {r.candidate.ballotNumber}
                        </span>
                        <span className="font-ko font-semibold text-ink">{r.candidate.name}</span>
                        <span className="label-ko text-dim">{r.candidate.party}</span>
                        <span className="ml-auto label-ko tabular-nums text-ink/85">
                          {pending ? (
                            <span className="text-dim">자료 확인 중</span>
                          ) : (
                            <>재산 {formatKrwShort(r.disclosure?.assetTotal ?? null)}</>
                          )}
                        </span>
                      </div>
                      {sigs.length > 0 && !pending ? (
                        <p className="label-ko mt-1 text-[#e0b075]">{sigs.join(' · ')}</p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <Link
                href={`/districts/${featuredId}`}
                className="label-ko-lg group mt-6 inline-flex items-center justify-between border border-cyan bg-cyan/10 px-4 py-3 text-cyan transition-colors hover:bg-cyan hover:text-bg"
              >
                <span>이 지역 전체 자료 보기</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>

              <footer className="mt-6 space-y-1 border-t border-hair-soft pt-4">
                <p className="label-ko text-dim">
                  {SITE.team} ·{' '}
                  <a href={`mailto:${SITE.contactEmail}`} className="text-cyan hover:underline">
                    {SITE.contactEmail}
                  </a>
                </p>
              </footer>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRINCIPLES BAR ===== */}
      <section className="border-b border-hair">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="hud-panel relative px-6 py-8 sm:px-10">
            <RegistrationMarks color="cyan" inset={10} />
            <HudLabel tone="cyan">서비스 원칙 · 3가지</HudLabel>
            <div className="mt-4 flex flex-col gap-1 display-ko text-[clamp(28px,5vw,52px)] font-extrabold leading-tight text-ink">
              <span>공개자료 우선</span>
              <span className="text-ink/75">출처·기준일 명시</span>
              <span>
                정치적 <span className="lime-block">중립</span>
              </span>
            </div>
            <div className="mt-6">
              <Link
                href="/principles"
                className="label-ko group inline-flex items-center gap-1 text-cyan hover:underline"
              >
                각 원칙 자세히 보기{' '}
                <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
            <p className="label-ko mt-3 text-dim">
              → 자료의 빈칸은 빈칸으로 둡니다. 잘못된 자료는 누구나 수정 요청할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ===== LATEST CANDIDATES ===== */}
      <section className="border-b border-hair">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <HudLabel tone="cyan">대표 선거구</HudLabel>
              <h2 className="mt-2 display-ko text-3xl font-bold text-ink">
                {featuredName}
              </h2>
            </div>
            <span className="label-ko text-dim">
              표시 {String(rows.length).padStart(2, '0')}건 / 전체{' '}
              {String(rows.length).padStart(2, '0')}건 ·{' '}
              <Link
                href={`/districts/${featuredId}`}
                className="text-cyan hover:underline"
              >
                모두 보기 →
              </Link>
            </span>
          </header>

          <div className="grid gap-px bg-hair sm:grid-cols-2">
            {rows.map((row) => {
              const top = listPromises(row.candidate.id)
                .slice()
                .sort(
                  (a, b) =>
                    b.specificityScore - a.specificityScore || a.orderNo - b.orderNo
                )
                .slice(0, 2);
              return (
                <CandidateCard
                  key={row.candidate.id}
                  candidate={row.candidate}
                  row={row}
                  topPromises={top}
                  className="border-0"
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CROSS-CHECK TEASER ===== */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="hud-panel relative grid gap-8 p-6 sm:p-10 lg:grid-cols-2">
            <RegistrationMarks color="lime" inset={10} />
            <div>
              <HudLabel tone="lime">공약과 공개자료가 만나는 자리</HudLabel>
              <h3 className="mt-2 display-ko text-3xl font-bold leading-tight text-ink">
                자료가 틀렸다면,{' '}
                <span className="lime-block">수정</span>
                하세요
              </h3>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink/75">
                공약과 공개자료를 함께 살펴봤을 때 잘못된 부분이 보인다면 누구나 수정 요청을
                보낼 수 있습니다. 모든 신고는 자료 검수 단서로 활용됩니다.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-3">
              <Link
                href="/principles"
                className="label-ko-lg group inline-flex items-center justify-between border border-hair px-4 py-3 text-ink/85 transition-colors hover:border-cyan hover:text-cyan"
              >
                <span>서비스 원칙 3가지 살펴보기</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/correction"
                className="label-ko-lg group inline-flex items-center justify-between border border-lime/40 bg-lime/10 px-4 py-3 text-lime transition-colors hover:bg-lime hover:text-bg"
              >
                <span>수정 요청 보내기</span>
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <p className="label-ko text-dim">
                회신은 자료 갱신으로 진행됩니다 ·{' '}
                <a
                  href={`mailto:${SITE.contactEmail}`}
                  className="text-cyan hover:underline"
                >
                  {SITE.contactEmail}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
