import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
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
import { formatSourceBasis } from '@/lib/format-date';
import {
  getCandidate,
  getCompareData,
  getDisclosure,
  getDistrict,
  listPromises,
} from '@/mocks/loader';

interface PageProps { params: Promise<{ id: string }>; }

// 함께 확인할 지점 anchor는 운영자 작성 항목이 있을 때만 노출 (런타임 동적)
const BASE_ANCHORS = [
  { id: 'profile', label: '인적사항' },
  { id: 'disclosure', label: '공개 자료' },
  { id: 'promises', label: '공약' },
  { id: 'military', label: '병역' },
  { id: 'past', label: '과거 출마' },
] as const;

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const c = getCandidate(id);
  if (!c) return { title: '후보를 찾을 수 없음' };
  return {
    title: `기호 ${c.ballotNumber} ${c.name} (${c.party})`,
    description: `${c.name} 후보의 공개자료·공약 — 정치적으로 중립적인 비교 자료`,
  };
}

export default async function CandidatePage({ params }: PageProps) {
  const { id } = await params;
  const candidate = getCandidate(id);
  if (!candidate) notFound();

  const district = getDistrict(candidate.districtId);
  const disclosure = getDisclosure(id);
  const allPromises = listPromises(id);
  const districtRows = getCompareData(candidate.districtId);
  const row = districtRows.find((r) => r.candidate.id === id);
  const crossPoints = row ? buildCrossCheckPoints(row, allPromises) : [];
  const isPending = candidate.reviewStatus !== 'reviewed';
  const basis = formatSourceBasis(disclosure?.sourceCheckedAt ?? null);
  // 함께 확인할 지점 anchor는 운영자 작성 항목이 있을 때만 노출
  const ANCHORS = crossPoints.length > 0
    ? [...BASE_ANCHORS, { id: 'cross-check', label: '함께 확인할 지점' } as const]
    : BASE_ANCHORS;

  return (
    <main className="mx-auto max-w-5xl px-6 py-6">
      {/* sticky anchor */}
      <nav aria-label="섹션 이동" className="sticky top-14 z-30 -mx-6 mb-6 border-b border-hair bg-bg/90 px-6 py-2 backdrop-blur">
        <ol className="label-ko flex flex-wrap gap-x-4 gap-y-1 text-dim">
          {ANCHORS.map((a, i) => (
            <li key={a.id}>
              <a href={`#${a.id}`} className="hover:text-cyan">
                <span className="mono mono-10 text-cyan">[{String(i + 1).padStart(2, '0')}]</span> {a.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* hero */}
      <section id="header" className="mb-10">
        <StatusChip tone={isPending ? 'pending' : 'live'}>
          <span>후보</span><ChipDivider /><span>기호 {candidate.ballotNumber}</span><ChipDivider /><span>기준일 · {basis}</span>
        </StatusChip>
        <div className="mt-4">
          <LimeStamp rotate={-4}>
            {isPending ? '자료 확인 중' : `검수 완료 · ${disclosure?.sourceCheckedAt?.replace(/-/g, '.') ?? ''}`}
          </LimeStamp>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-[160px_1fr]">
          <div className="relative aspect-[4/5] hud-panel striped-placeholder overflow-hidden">
            <RegistrationMarks color="cyan" size={10} inset={6} />
            {disclosure?.photoUrl ? (
              // NEC CDN deep-link (선거기간 동안 안전, 선거 후 자체 미러 검토)
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={disclosure.photoUrl}
                alt={`${candidate.name} 후보 사진 (NEC 공개자료)`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="label-ko text-dim">후보 사진 · 시연용</span>
              </div>
            )}
          </div>
          <div>
            <p className="label-ko text-cyan">기호 {candidate.ballotNumber}</p>
            <h1 className="display-ko mt-1 text-5xl font-extrabold tracking-tight text-ink">
              {candidate.name}
              {candidate.nameHanja ? (
                <span className="ml-2 align-baseline font-ko text-2xl font-normal text-dim">
                  ({candidate.nameHanja})
                </span>
              ) : null}
            </h1>
            <p className="label-ko mt-2 text-dim">
              {candidate.party}
              {candidate.birthDate
                ? ` · ${candidate.birthDate.replace(/-/g, '.')}생`
                : candidate.birthYear ? ` · ${candidate.birthYear}년생` : ''}
              {candidate.gender === 'M' ? ' · 남' : candidate.gender === 'F' ? ' · 여' : ''}
              {' '}· 본 정보는 공개자료 기준
            </p>
            {district ? (
              <Link
                href={`/districts/${district.id}`}
                className="label-ko mt-3 inline-flex items-center gap-1.5 border border-hair px-2.5 py-1 text-ink/80 transition-colors hover:border-cyan hover:text-cyan"
              >
                <span aria-hidden>←</span>
                <span>{district.name} 후보 목록</span>
              </Link>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.electionRunCount ? (
                <NeutralBadge tone="muted">입후보 {candidate.electionRunCount}회</NeutralBadge>
              ) : null}
              <NeutralBadge tone="muted">출처 {String(disclosure?.sourceUrls.length ?? 0).padStart(2, '0')}건</NeutralBadge>
            </div>
          </div>
        </div>
      </section>

      {/* 인적사항 (NEC info.nec 등록자료 — 직업·학력·경력) */}
      {(candidate.occupation || candidate.education || (candidate.career && candidate.career.length > 0)) ? (
        <section id="profile" className="mb-10 scroll-mt-32">
          <HudLabel tone="cyan">인적사항</HudLabel>
          <article className="hud-panel relative mt-3 grid gap-4 p-5 sm:grid-cols-3">
            <RegistrationMarks color="dim" size={10} inset={6} />
            {candidate.occupation ? (
              <div>
                <p className="label-ko text-dim">직업</p>
                <p className="mt-1 text-ink/85">{candidate.occupation}</p>
              </div>
            ) : null}
            {candidate.education ? (
              <div>
                <p className="label-ko text-dim">학력</p>
                <p className="mt-1 leading-relaxed text-ink/85">{candidate.education}</p>
              </div>
            ) : null}
            {candidate.career && candidate.career.length > 0 ? (
              <div className="sm:col-span-3">
                <p className="label-ko text-dim">경력</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-ink/85">
                  {candidate.career.map((c, i) => (
                    <li key={i} className="leading-relaxed">{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        </section>
      ) : null}

      <section id="disclosure" className="mb-10 scroll-mt-32">
        {disclosure ? <DisclosureCard disclosure={disclosure} /> : <DataPendingNote />}
      </section>

      <section id="promises" className="mb-10 scroll-mt-32">
        <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <HudLabel tone="cyan">공약 {String(allPromises.length).padStart(2, '0')}건</HudLabel>
        </header>
        {allPromises.length === 0 ? (
          <DataPendingNote />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allPromises.map((p, i) => <PromiseCard key={p.id} promise={p} index={i + 1} />)}
          </div>
        )}
      </section>

      <section id="military" className="mb-10 scroll-mt-32">
        <HudLabel tone="cyan">병역</HudLabel>
        {disclosure ? (
          <article className="hud-panel relative mt-3 p-5">
            <RegistrationMarks color="dim" size={10} inset={6} />
            <p className="text-[14.5px] leading-relaxed text-ink/85">{disclosure.militaryRecord}</p>
            {disclosure.militarySummary ? (
              <p className="label-ko mt-2 text-dim">
                요약: <span className="text-ink/80">{disclosure.militarySummary}</span> · 공개자료 기준
              </p>
            ) : null}
            {disclosure.sourceUrls[0] ? (
              <div className="mt-3"><SourceLink href={disclosure.sourceUrls[0]} basisDate={basis} /></div>
            ) : null}
          </article>
        ) : <DataPendingNote className="mt-3" />}
      </section>

      {/* 과거 출마 결과 (위키 CC BY-SA 4.0 출처) */}
      {candidate.pastElections && candidate.pastElections.length > 0 ? (
        <section id="past" className="mb-10 scroll-mt-32">
          <HudLabel tone="cyan">과거 출마 이력</HudLabel>
          <p className="label-ko mt-2 text-dim">
            본 항목은 <a className="text-cyan hover:underline" href="https://ko.wikipedia.org/" target="_blank" rel="noreferrer noopener">위키백과</a> 출처입니다.{' '}
            <span className="text-ink/70">CC BY-SA 4.0 라이선스</span>에 따라 인용했습니다.
          </p>
          <div className="hud-panel relative mt-3 overflow-x-auto p-5">
            <RegistrationMarks color="dim" size={10} inset={6} />
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="label-ko border-b border-hair text-dim">
                  <th className="py-2 pr-3">연도</th>
                  <th className="py-2 pr-3">선거</th>
                  <th className="py-2 pr-3">선거구</th>
                  <th className="py-2 pr-3">정당</th>
                  <th className="py-2 pr-3 text-right">득표율</th>
                  <th className="py-2 pr-3 text-right">순위</th>
                  <th className="py-2">결과</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair text-ink/85">
                {candidate.pastElections.map((p, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3 tabular-nums">{p.year}</td>
                    <td className="py-2 pr-3">{p.electionName}</td>
                    <td className="py-2 pr-3">{p.district}</td>
                    <td className="py-2 pr-3">{p.party}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{p.votePct.toFixed(2)}%</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{p.rank}위</td>
                    <td className="py-2">
                      <NeutralBadge tone={p.result === '당선' ? 'info' : 'muted'}>
                        {p.result}{p.note ? ` · ${p.note}` : ''}
                      </NeutralBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* 함께 확인할 지점 — 운영자가 작성한 항목이 있을 때만 노출 (자동 매칭 비활성화) */}
      {crossPoints.length > 0 ? (
        <section id="cross-check" className="mb-10 scroll-mt-32">
          <HudLabel tone="lime">함께 확인할 지점</HudLabel>
          <p className="label-ko mt-2 text-dim">
            공개자료와 공약을 함께 살펴볼 때 도움이 될 만한 운영자 작성 항목입니다.
          </p>
          <ul className="mt-4 space-y-3">
            {crossPoints.map((p) => {
              const promise = allPromises.find((x) => x.id === p.promiseId);
              return (
                <li key={p.promiseId} className="relative hud-panel p-4 text-sm">
                  <RegistrationMarks color="dim" size={8} inset={5} />
                  {promise ? (
                    <p className="label-ko mb-1 text-dim">
                      관련 공약 · <span className="text-ink/80">{promise.title}</span>
                    </p>
                  ) : null}
                  <p className="leading-relaxed text-ink/85">{p.text}</p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="label-ko mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-hair pt-5 text-dim">
        {district ? (
          <Link href={`/districts/${district.id}`} className="hover:text-cyan">
            ← {district.name} 목록
          </Link>
        ) : <span />}
        <Link href={`/correction?candidateId=${candidate.id}`} className="text-cyan hover:underline">
          수정 요청 →
        </Link>
      </div>
    </main>
  );
}
