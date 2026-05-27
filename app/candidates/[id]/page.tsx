import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CheckCard, DataPendingNote, DisclosureCard, NeutralBadge, PromiseCard, SourceLink } from '@/components/domain';
import { buildCrossCheckPoints } from '@/lib/cross-check';
import { specificityLabel, avgSpecificity } from '@/lib/promise-specificity';
import { formatSourceBasis } from '@/lib/format-date';
import { getCandidate, getCompareData, getDisclosure, getDistrict, listCheckCards, listPromises } from '@/mocks/loader';

interface PageProps {
  params: Promise<{ id: string }>;
}

const ANCHORS = [
  { id: 'header', label: '개요' },
  { id: 'disclosure', label: '공개 자료' },
  { id: 'promises', label: '공약' },
  { id: 'check-cards', label: '확인 필요도' },
  { id: 'military', label: '병역' },
  { id: 'cross-check', label: '함께 확인할 지점' },
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <nav aria-label="섹션 이동" className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-background/95 px-4 py-2 backdrop-blur">
        <ol className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {ANCHORS.map((a) => (
            <li key={a.id}>
              <a href={`#${a.id}`} className="hover:text-foreground">
                {a.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <section id="header" className="mb-8 flex flex-wrap items-start gap-4">
        <div
          aria-hidden
          className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-3xl text-muted-foreground"
        >
          ●
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="rounded bg-foreground/90 px-2 py-0.5 text-sm font-semibold text-background">
              기호 {candidate.ballotNumber}
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">{candidate.name}</h1>
            <span className="text-sm text-muted-foreground">· {candidate.party}</span>
            {isPending ? <NeutralBadge tone="muted">자료 확인 중</NeutralBadge> : null}
          </div>
          {district ? (
            <p className="mt-1 text-sm text-muted-foreground">
              <Link
                href={`/districts/${district.id}`}
                className="underline-offset-2 hover:underline"
              >
                {district.name}
              </Link>
            </p>
          ) : null}
          {candidate.birthYear ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {candidate.birthYear}년생 · 본 정보는 공개자료 기준
            </p>
          ) : null}
        </div>
      </section>

      <section id="disclosure" className="mb-10 scroll-mt-20">
        <h2 className="mb-3 text-lg font-semibold">공개 자료</h2>
        {disclosure ? (
          <DisclosureCard disclosure={disclosure} />
        ) : (
          <DataPendingNote />
        )}
      </section>

      <section id="promises" className="mb-10 scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">공약</h2>
          {allPromises.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              총 {allPromises.length}건 · 평균 구체성{' '}
              <span className="tabular-nums">{avgSpecificity(allPromises.map((p) => p.specificityScore))}</span>{' '}
              ({specificityLabel(Math.round(avgSpecificity(allPromises.map((p) => p.specificityScore))))})
            </p>
          ) : null}
        </div>
        {allPromises.length === 0 ? (
          <DataPendingNote />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allPromises.map((p) => (
              <PromiseCard key={p.id} promise={p} />
            ))}
          </div>
        )}
      </section>

      <section id="check-cards" className="mb-10 scroll-mt-20">
        <h2 className="mb-3 text-lg font-semibold">확인 필요도</h2>
        {row ? (
          <p className="mb-3 text-sm text-muted-foreground">
            {row.checkPriorityLabel} (내부 점수 {row.checkPriorityScore}, 0~160)
          </p>
        ) : null}
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
                basisDate={disclosure ? formatSourceBasis(disclosure.sourceCheckedAt) : undefined}
              />
            ))}
          </div>
        )}
      </section>

      <section id="military" className="mb-10 scroll-mt-20">
        <h2 className="mb-3 text-lg font-semibold">병역</h2>
        {disclosure ? (
          <article className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm leading-relaxed">{disclosure.militaryRecord}</p>
            {disclosure.militarySummary ? (
              <p className="mt-2 text-xs text-muted-foreground">
                요약: {disclosure.militarySummary} · 공개자료 기준
              </p>
            ) : null}
            {disclosure.sourceUrls[0] ? (
              <div className="mt-3">
                <SourceLink href={disclosure.sourceUrls[0]} basisDate={formatSourceBasis(disclosure.sourceCheckedAt)} />
              </div>
            ) : null}
          </article>
        ) : (
          <DataPendingNote />
        )}
      </section>

      <section id="cross-check" className="mb-10 scroll-mt-20">
        <h2 className="mb-1 text-lg font-semibold">함께 확인할 지점</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          공개자료와 공약을 함께 살펴볼 때 도움이 될 만한 항목입니다. 운영자가 작성한 경우 우선 표시되며, 자동 매칭이 없는 경우 표시하지 않습니다.
        </p>
        {crossPoints.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
            지금 표시할 함께 확인 지점이 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {crossPoints.map((p) => {
              const promise = allPromises.find((x) => x.id === p.promiseId);
              return (
                <li
                  key={p.promiseId}
                  className="rounded-lg border border-border bg-card p-4 text-sm"
                >
                  {promise ? (
                    <p className="mb-1 text-xs text-muted-foreground">
                      관련 공약: {promise.title}
                    </p>
                  ) : null}
                  <p className="leading-relaxed">{p.text}</p>
                  <p className="mt-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {p.source === 'manual' ? '운영자 작성' : '자동 매칭'}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        {district ? (
          <Link href={`/districts/${district.id}`} className="hover:text-foreground">
            ← {district.name} 후보 목록으로
          </Link>
        ) : (
          <span />
        )}
        <Link
          href={`/correction?candidateId=${candidate.id}`}
          className="underline-offset-2 hover:underline"
        >
          이 후보 자료에 오류가 있다면 정정 요청
        </Link>
      </div>
    </main>
  );
}
