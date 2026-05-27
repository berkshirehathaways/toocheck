import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  CheckCard,
  DataPendingNote,
  DisclosureCard,
  HudLabel,
  LimeStamp,
  NeutralBadge,
  PromiseCard,
  RegistrationMarks,
  SourceLink,
  StatusChip,
  ChipDivider,
} from '@/components/domain';
import { buildCrossCheckPoints } from '@/lib/cross-check';
import { avgSpecificity, specificityLabel } from '@/lib/promise-specificity';
import { formatSourceBasis } from '@/lib/format-date';
import {
  getCandidate,
  getCompareData,
  getDisclosure,
  getDistrict,
  listCheckCards,
  listPromises,
} from '@/mocks/loader';

interface PageProps { params: Promise<{ id: string }>; }

const ANCHORS = [
  { id: 'disclosure', label: '공개 자료', en: 'DISCLOSURE' },
  { id: 'promises', label: '공약', en: 'PLEDGES' },
  { id: 'check-cards', label: '확인 필요도', en: 'CHECK.PRIORITY' },
  { id: 'military', label: '병역', en: 'MILITARY' },
  { id: 'cross-check', label: '함께 확인할 지점', en: 'CROSS.CHECK' },
] as const;

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const c = getCandidate(id);
  if (!c) return { title: '후보를 찾을 수 없음' };
  return {
    title: `기호 ${c.ballotNumber} ${c.name} (${c.party})`,
    description: `${c.name} 후보의 공개자료·공약·확인 필요도 — 비당파 비교 자료`,
  };
}

export default async function CandidatePage({ params }: PageProps) {
  const { id } = await params;
  const candidate = getCandidate(id);
  if (!candidate) notFound();

  const district = getDistrict(candidate.districtId);
  const disclosure = getDisclosure(id);
  const allPromises = listPromises(id);
  const checkCards = listCheckCards(id);
  const districtRows = getCompareData(candidate.districtId);
  const row = districtRows.find((r) => r.candidate.id === id);
  const crossPoints = row ? buildCrossCheckPoints(row, allPromises) : [];
  const isPending = candidate.reviewStatus !== 'reviewed';
  const basis = formatSourceBasis(disclosure?.sourceCheckedAt ?? null);
  const avg = avgSpecificity(allPromises.map((p) => p.specificityScore));

  return (
    <main className="mx-auto max-w-5xl px-6 py-6">
      {/* sticky anchor */}
      <nav aria-label="섹션" className="sticky top-14 z-30 -mx-6 mb-6 border-b border-hair bg-bg/90 px-6 py-2 backdrop-blur">
        <ol className="mono mono-10 flex flex-wrap gap-x-4 gap-y-1 text-dim">
          {ANCHORS.map((a, i) => (
            <li key={a.id}>
              <a href={`#${a.id}`} className="hover:text-cyan">
                [{String(i + 1).padStart(2, '0')}] {a.en}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* hero */}
      <section id="header" className="mb-10">
        <StatusChip tone={isPending ? 'pending' : 'live'}>
          <span>CANDIDATE</span><ChipDivider /><span>기호 {candidate.ballotNumber}</span><ChipDivider /><span>{basis}</span>
        </StatusChip>
        <div className="mt-4">
          <LimeStamp rotate={-4}>
            {isPending ? '자료 확인 중 // PENDING' : `검수 완료 // ${disclosure?.sourceCheckedAt?.replace(/-/g, '.') ?? ''}`}
          </LimeStamp>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-[160px_1fr]">
          <div className="relative aspect-[4/5] hud-panel striped-placeholder">
            <RegistrationMarks color="cyan" size={10} inset={6} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="mono mono-10 text-dim">PORTRAIT // SILHOUETTE</span>
            </div>
          </div>
          <div>
            <p className="mono mono-10 text-cyan">[기호 {candidate.ballotNumber}]</p>
            <h1 className="display-ko mt-1 text-5xl font-extrabold tracking-tight text-ink">
              {candidate.name}
            </h1>
            <p className="mono mono-10 mt-2 text-dim">
              · <span className="normal-case tracking-normal" style={{ letterSpacing: 0 }}>{candidate.party}</span>
              {candidate.birthYear ? ` · ${candidate.birthYear}년생` : ''} · 본 정보는 공개자료 기준
            </p>
            {district ? (
              <p className="mono mono-10 mt-1 text-dim">
                ← <Link href={`/districts/${district.id}`} className="text-cyan hover:underline">
                  <span className="normal-case tracking-normal" style={{ letterSpacing: 0 }}>{district.name}</span>
                </Link>
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {row ? (
                <NeutralBadge tone={row.checkPriorityScore >= 71 ? 'attention' : row.checkPriorityScore >= 31 ? 'check' : 'info'}>
                  {row.checkPriorityLabel} · SCORE {String(row.checkPriorityScore).padStart(3, '0')}/160
                </NeutralBadge>
              ) : null}
              <NeutralBadge tone="muted">RECORDED_BY admin</NeutralBadge>
              <NeutralBadge tone="muted">SOURCES {String(disclosure?.sourceUrls.length ?? 0).padStart(2, '0')}</NeutralBadge>
            </div>
          </div>
        </div>
      </section>

      <section id="disclosure" className="mb-10 scroll-mt-32">
        {disclosure ? <DisclosureCard disclosure={disclosure} /> : <DataPendingNote />}
      </section>

      <section id="promises" className="mb-10 scroll-mt-32">
        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <HudLabel tone="cyan">[02] // 공약 [{String(allPromises.length).padStart(2, '0')}]</HudLabel>
          {allPromises.length > 0 ? (
            <p className="mono mono-10 text-dim">
              평균 구체성 <span className="tabular-nums text-ink/85">{avg.toFixed(1)}</span> · {specificityLabel(Math.round(avg))}
            </p>
          ) : null}
        </header>
        {allPromises.length === 0 ? (
          <DataPendingNote />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allPromises.map((p, i) => <PromiseCard key={p.id} promise={p} index={i + 1} />)}
          </div>
        )}
      </section>

      <section id="check-cards" className="mb-10 scroll-mt-32">
        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <HudLabel tone="cyan">[03] // 확인 필요도</HudLabel>
          {row ? (
            <span className="mono mono-10 text-dim">
              SCORE <span className="text-ink/85 tabular-nums">{String(row.checkPriorityScore).padStart(3, '0')}</span> / 160
            </span>
          ) : null}
        </header>
        {checkCards.length === 0 ? (
          <DataPendingNote />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {checkCards.map((c) => (
              <CheckCard
                key={c.id}
                severity={c.severity}
                title={c.title}
                body={c.body}
                sourceUrl={c.sourceUrl}
                basisDate={basis}
              />
            ))}
          </div>
        )}
      </section>

      <section id="military" className="mb-10 scroll-mt-32">
        <HudLabel tone="cyan">[04] // 병역</HudLabel>
        {disclosure ? (
          <article className="hud-panel relative mt-3 p-5">
            <RegistrationMarks color="dim" size={10} inset={6} />
            <p className="text-[14.5px] leading-relaxed text-ink/85">{disclosure.militaryRecord}</p>
            {disclosure.militarySummary ? (
              <p className="mono mono-10 mt-2 text-dim">
                요약: <span className="normal-case tracking-normal text-ink/80" style={{ letterSpacing: 0 }}>{disclosure.militarySummary}</span> · 공개자료 기준
              </p>
            ) : null}
            {disclosure.sourceUrls[0] ? (
              <div className="mt-3"><SourceLink href={disclosure.sourceUrls[0]} basisDate={basis} /></div>
            ) : null}
          </article>
        ) : <DataPendingNote className="mt-3" />}
      </section>

      <section id="cross-check" className="mb-10 scroll-mt-32">
        <HudLabel tone="lime">[05] // 함께 확인할 지점</HudLabel>
        <p className="mono mono-10 mt-2 text-dim">
          <span className="normal-case tracking-normal" style={{ letterSpacing: 0 }}>
            공개자료와 공약을 함께 살펴볼 때 도움이 될 만한 항목입니다. 운영자가 작성한 경우 우선 표시되며, 자동 매칭이 없는 경우 표시하지 않습니다.
          </span>
        </p>
        {crossPoints.length === 0 ? (
          <p className="mono mono-10 mt-4 border border-dashed border-hair bg-bg-elev px-4 py-3 text-dim">
            <span className="normal-case tracking-normal text-ink/70" style={{ letterSpacing: 0 }}>
              지금 표시할 함께 확인 지점이 없습니다. 서비스가 의혹을 만들지 않습니다.
            </span>
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {crossPoints.map((p) => {
              const promise = allPromises.find((x) => x.id === p.promiseId);
              return (
                <li key={p.promiseId} className="relative hud-panel p-4 text-sm">
                  <RegistrationMarks color="dim" size={8} inset={5} />
                  {promise ? (
                    <p className="mono mono-10 mb-1 text-dim">
                      관련 공약 · <span className="text-ink/80 normal-case tracking-normal" style={{ letterSpacing: 0 }}>{promise.title}</span>
                    </p>
                  ) : null}
                  <p className="leading-relaxed text-ink/85">{p.text}</p>
                  <p className="mono mono-10 mt-2 text-dim">
                    {p.source === 'manual' ? (
                      <span className="text-lime">운영자 작성</span>
                    ) : (
                      <span className="text-cyan">자동 매칭</span>
                    )}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mono mono-10 mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-hair pt-5 text-dim">
        {district ? (
          <Link href={`/districts/${district.id}`} className="hover:text-cyan">
            ← <span className="normal-case tracking-normal" style={{ letterSpacing: 0 }}>{district.name}</span> 목록
          </Link>
        ) : <span />}
        <Link href={`/correction?candidateId=${candidate.id}`} className="text-cyan hover:underline">
          정정 요청 →
        </Link>
      </div>
    </main>
  );
}
