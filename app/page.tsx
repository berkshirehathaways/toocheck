import Link from 'next/link';
import {
  CandidateCard,
  HudLabel,
  LimeStamp,
  NeutralBadge,
  RegistrationMarks,
  SpeedLines,
  StatusChip,
  ChipDivider,
} from '@/components/domain';
import { SITE } from '@/lib/site/config';
import { getCompareData, listCandidates, listElections, listPromises } from '@/mocks/loader';
import { formatSourceBasis } from '@/lib/format-date';
import { getDistrictSourceCheckedAt } from '@/mocks/loader';

export default function HomePage() {
  const elections = listElections();
  const election = elections[0];
  const rows = getCompareData(SITE.testDistrictId);
  const basis = formatSourceBasis(getDistrictSourceCheckedAt(SITE.testDistrictId));

  return (
    <main className="relative overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative border-b border-hair bg-bg">
        <div className="blueprint-grid pointer-events-none absolute inset-0 opacity-60" />
        <SpeedLines />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr]">
          {/* LEFT */}
          <div>
            <StatusChip tone="live">
              <span>DATA.OK</span><ChipDivider /><span>{election?.name ?? '2026 지방선거'}</span><ChipDivider /><span>01 DISTRICT</span>
            </StatusChip>
            <div className="mt-5 inline-block">
              <LimeStamp rotate={-4}>검수 완료 // 토체크팀</LimeStamp>
            </div>
            <h1 className="mt-6 display-ko text-[clamp(40px,7.5vw,84px)] text-ink">
              공약은 보고,
              <br />
              <span className="stroke-cyan">자료는 확인하고,</span>
              <br />
              판단은{' '}
              <span className="lime-block">본인</span>
              이.
            </h1>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink/70">
              {SITE.disclaimerLong}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/districts"
                className="mono mono-10 inline-flex items-center justify-center gap-2 border border-ink bg-ink px-5 py-3 text-bg transition-colors hover:bg-cyan hover:text-bg"
              >
                내 지역 후보 확인하기 →
              </Link>
              <Link
                href={`/districts/${SITE.testDistrictId}`}
                className="mono mono-10 inline-flex items-center justify-center gap-2 border border-hair px-5 py-3 text-ink/85 transition-colors hover:border-cyan hover:text-cyan"
              >
                테스트 지역으로 보기 ►
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              <NeutralBadge tone="cyan">SYS.READY</NeutralBadge>
              <NeutralBadge tone="lime">V.2026.05</NeutralBadge>
              <NeutralBadge tone="muted">MOCK_DATA / 가상 시연용</NeutralBadge>
            </div>
          </div>

          {/* RIGHT — instrument card */}
          <div className="relative">
            <div className="relative aspect-[4/5] hud-panel striped-placeholder">
              <RegistrationMarks color="cyan" size={16} inset={16} />
              <div className="absolute right-4 top-4 flex flex-col items-end gap-1 text-right">
                <HudLabel tone="cyan">SYS.READY</HudLabel>
                <span className="mono mono-10 text-dim">V.2026.05</span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 space-y-2">
                <HudLabel tone="lime">토체크팀 // CONTACT</HudLabel>
                <p className="mono mono-10 text-ink/70">
                  <span className="normal-case tracking-normal" style={{ letterSpacing: 0 }}>
                    {SITE.contactEmail}
                  </span>
                </p>
                <p className="mono mono-10 text-dim">{basis}</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="mono mono-10 text-dim">INSTRUMENT // PANEL_01</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRINCIPLES BAR ===== */}
      <section className="border-b border-hair">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="hud-panel relative px-6 py-8 sm:px-10">
            <RegistrationMarks color="cyan" inset={10} />
            <HudLabel tone="cyan">PRINCIPLES // 05_AXES</HudLabel>
            <div className="mt-4 flex flex-col gap-1 display-ko text-[clamp(28px,5vw,52px)]">
              <span className="text-ink">공개자료 우선.</span>
              <span className="stroke-cyan">출처·기준일 명시.</span>
              <span>
                <span className="lime-block">비당파</span>
                <span className="text-ink">.</span>
              </span>
            </div>
            <p className="mono mono-10 mt-6 text-dim">
              → 자료의 빈칸은 빈칸으로 둡니다. 잘못된 자료는 누구나 정정 요청할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* ===== LATEST CANDIDATES ===== */}
      <section className="border-b border-hair">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <HudLabel tone="cyan">ARCHIVE // LATEST</HudLabel>
              <h2 className="mt-2 display-ko text-3xl font-bold text-ink">최근 검수 항목</h2>
            </div>
            <span className="mono mono-10 text-dim">
              SHOWING [{String(rows.length).padStart(2, '0')}] OF [{String(rows.length).padStart(2, '0')}] /{' '}
              <Link href={`/districts/${SITE.testDistrictId}`} className="text-cyan hover:underline">
                VIEW ALL →
              </Link>
            </span>
          </header>

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
        </div>
      </section>

      {/* ===== CROSS-CHECK TEASER ===== */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="hud-panel relative grid gap-8 p-6 sm:p-10 lg:grid-cols-2">
            <RegistrationMarks color="lime" inset={10} />
            <div>
              <HudLabel tone="lime">CROSS.CHECK // PUBLIC</HudLabel>
              <h3 className="mt-2 display-ko text-3xl font-bold text-ink">
                함께 <span className="stroke-cyan">확인</span>할 지점
              </h3>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-ink/75">
                공개자료와 공약을 함께 살펴볼 때 도움이 될 만한 항목을 운영자가
                작성하거나 자동 매칭으로 찾아 표시합니다. 서비스가 의혹을 만들지 않습니다.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-3">
              <Link
                href="/principles"
                className="mono mono-10 inline-flex items-center justify-between border border-hair px-4 py-3 text-ink/85 transition-colors hover:border-cyan hover:text-cyan"
              >
                <span>서비스 원칙 5가지 →</span>
                <span aria-hidden>►</span>
              </Link>
              <Link
                href="/correction"
                className="mono mono-10 inline-flex items-center justify-between border border-lime/40 bg-lime/10 px-4 py-3 text-lime transition-colors hover:bg-lime hover:text-bg"
              >
                <span>정정 요청 보내기 →</span>
                <span aria-hidden>►</span>
              </Link>
              <p className="mono mono-10 text-dim">
                <span aria-hidden>·</span> 회신은 자료 갱신으로 ·{' '}
                <a href={`mailto:${SITE.contactEmail}`} className="text-cyan hover:underline">
                  <span className="normal-case tracking-normal" style={{ letterSpacing: 0 }}>{SITE.contactEmail}</span>
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
