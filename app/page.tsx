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
  listElections,
  listPromises,
  getDistrictSourceCheckedAt,
} from '@/mocks/loader';
import { formatSourceBasis } from '@/lib/format-date';
import { formatKrwShort } from '@/lib/format-krw';

export default function HomePage() {
  const elections = listElections();
  const election = elections[0];
  const rows = getCompareData(SITE.testDistrictId);
  const basis = formatSourceBasis(getDistrictSourceCheckedAt(SITE.testDistrictId));

  return (
    <main className="relative overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative border-b border-hair bg-bg">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-50" />
        <SpeedLines />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          {/* LEFT — headline */}
          <div className="flex flex-col">
            <StatusChip tone="live">
              <span>검수 완료</span>
              <ChipDivider />
              <span>{election?.name ?? '2026 지방선거'}</span>
              <ChipDivider />
              <span>지역 01곳</span>
            </StatusChip>

            <h1 className="mt-8 display-ko text-[clamp(48px,8.5vw,108px)] font-extrabold leading-[1.04] tracking-tight text-ink">
              당신의 후보는,
              <br />
              어떤{' '}
              <span className="relative inline-block">
                <span className="relative z-10">사람</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-[0.08em] z-0 h-[0.14em] bg-cyan"
                />
              </span>
              입니까?
            </h1>

            {/* Brand signature */}
            <div className="mt-8 flex items-center gap-3">
              <span
                aria-hidden
                className="block h-1.5 w-1.5 bg-lime shadow-[0_0_8px_rgba(190,242,100,0.7)]"
              />
              <p className="display-ko text-lg font-bold tracking-tight text-ink/85 sm:text-xl">
                투표 전 체크, 투체크
              </p>
              <span aria-hidden className="ml-1 h-px flex-1 max-w-32 bg-hair" />
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
                href={`/districts/${SITE.testDistrictId}`}
                className="label-ko-lg inline-flex items-center justify-center gap-2 border border-hair px-5 py-3 text-ink/85 transition-colors hover:border-cyan hover:text-cyan"
              >
                테스트 지역으로 보기 ►
              </Link>
            </div>

            <p className="mono mono-10 mt-6 text-dim">
              <span className="normal-case tracking-normal" style={{ letterSpacing: 0 }}>
                지금 보이는 모든 후보 정보는 시연용 가상 데이터입니다.
              </span>
            </p>
          </div>

          {/* RIGHT — live sample data instrument */}
          <div className="relative">
            <div className="relative flex aspect-[4/5] flex-col hud-panel overflow-hidden p-6">
              <RegistrationMarks color="cyan" size={14} inset={12} />

              <header className="flex items-baseline justify-between">
                <HudLabel tone="cyan">샘플 미리보기</HudLabel>
                <span className="label-ko text-dim">{basis}</span>
              </header>

              <p className="display-ko mt-3 text-2xl font-bold leading-tight text-ink">
                샘플 시 가나구청장
              </p>
              <p className="label-ko text-dim">{election?.name}</p>

              <ul className="mt-6 space-y-3 border-t border-hair-soft pt-5">
                {rows.map((r) => {
                  const pending = r.candidate.reviewStatus !== 'reviewed';
                  const hasCrime = (r.disclosure?.criminalRecords.length ?? 0) > 0;
                  const hasTax = (r.disclosure?.taxArrears.length ?? 0) > 0;
                  return (
                    <li
                      key={r.candidate.id}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm"
                    >
                      <span className="label-ko shrink-0 text-cyan">
                        기호 {r.candidate.ballotNumber}
                      </span>
                      {pending ? (
                        <span className="label-ko text-dim">자료 확인 중</span>
                      ) : (
                        <>
                          <span className="font-ko font-semibold text-ink">{r.candidate.name}</span>
                          <span className="label-ko text-dim">{r.candidate.party}</span>
                          <span className="ml-auto label-ko tabular-nums text-ink/85">
                            재산 {formatKrwShort(r.disclosure?.assetTotal ?? null)}
                          </span>
                        </>
                      )}
                      {(hasCrime || hasTax) && !pending ? (
                        <span className="basis-full label-ko text-[#e0b075]">
                          {hasCrime ? '전과 공개 · ' : ''}{hasTax ? '체납 공개' : ''}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <footer className="mt-auto space-y-1 border-t border-hair-soft pt-4">
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
            <HudLabel tone="cyan">서비스 원칙 · 5가지</HudLabel>
            <div className="mt-4 flex flex-col gap-1 display-ko text-[clamp(28px,5vw,52px)] font-extrabold leading-tight text-ink">
              <span>공개자료 우선.</span>
              <span className="text-ink/75">출처·기준일 명시.</span>
              <span>
                <span className="relative inline-block">
                  <span className="relative z-10">비당파</span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-[0.08em] z-0 h-[0.14em] bg-lime"
                  />
                </span>
                <span>.</span>
              </span>
            </div>
            <p className="label-ko mt-6 text-dim">
              → 자료의 빈칸은 빈칸으로 둡니다. 잘못된 자료는 누구나 정정 요청할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ===== LATEST CANDIDATES ===== */}
      <section className="border-b border-hair">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <HudLabel tone="cyan">최근 검수 항목</HudLabel>
              <h2 className="mt-2 display-ko text-3xl font-bold text-ink">
                샘플 시 가나구청장
              </h2>
            </div>
            <span className="label-ko text-dim">
              표시 {String(rows.length).padStart(2, '0')}건 / 전체{' '}
              {String(rows.length).padStart(2, '0')}건 ·{' '}
              <Link
                href={`/districts/${SITE.testDistrictId}`}
                className="text-cyan hover:underline"
              >
                모두 보기 →
              </Link>
            </span>
          </header>

          <div className="grid gap-px bg-hair sm:grid-cols-2 lg:grid-cols-3">
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
                  basisDate={basis}
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
              <HudLabel tone="lime">함께 확인할 지점</HudLabel>
              <h3 className="mt-2 display-ko text-3xl font-bold leading-tight text-ink">
                함께{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">확인</span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-[0.08em] z-0 h-[0.14em] bg-cyan"
                  />
                </span>
                할 지점
              </h3>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink/75">
                공개자료와 공약을 함께 살펴볼 때 도움이 될 만한 항목을 운영자가 작성하거나
                자동 매칭으로 찾아 표시합니다. 서비스가 의혹을 만들지 않습니다.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-3">
              <Link
                href="/principles"
                className="label-ko-lg inline-flex items-center justify-between border border-hair px-4 py-3 text-ink/85 transition-colors hover:border-cyan hover:text-cyan"
              >
                <span>서비스 원칙 5가지 →</span>
                <span aria-hidden>►</span>
              </Link>
              <Link
                href="/correction"
                className="label-ko-lg inline-flex items-center justify-between border border-lime/40 bg-lime/10 px-4 py-3 text-lime transition-colors hover:bg-lime hover:text-bg"
              >
                <span>정정 요청 보내기 →</span>
                <span aria-hidden>►</span>
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
