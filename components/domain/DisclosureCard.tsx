import { cn } from '@/lib/utils';
import { formatKrwShort } from '@/lib/format-krw';
import { formatSourceBasis } from '@/lib/format-date';
import type { AssetCategoryBreakdown, CandidateDisclosure } from '@/types/domain';

import { AssetBreakdownBar } from './AssetBreakdownBar';
import { HudLabel } from './HudLabel';
import { NeutralBadge } from './NeutralBadge';
import { RegistrationMarks } from './RegistrationMarks';
import { SourceLink } from './SourceLink';

export interface DisclosureCardProps {
  disclosure: CandidateDisclosure;
  className?: string;
}

export function DisclosureCard({ disclosure, className }: DisclosureCardProps) {
  const basis = formatSourceBasis(disclosure.sourceCheckedAt);
  const sourceUrl = disclosure.sourceUrls[0];
  return (
    <section className={cn('hud-panel relative p-6', className)}>
      <RegistrationMarks color="cyan" inset={8} />
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <HudLabel tone="cyan">공개 자료 04건</HudLabel>
        <span className="label-ko text-dim">기준일 · {basis}</span>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="label-ko text-dim">재산총액</p>
          <p className="mt-1 font-ko text-3xl font-bold tabular-nums text-ink">
            {formatKrwShort(disclosure.assetTotal)}
          </p>
          {/* #14 PR 4: petiBreakdown 있으면 정밀 분해 표시 (assetBreakdown 막대 대체) */}
          {disclosure.petiBreakdown ? (
            <PetiBreakdownView breakdown={disclosure.petiBreakdown} />
          ) : (
            <div className="mt-4">
              <AssetBreakdownBar breakdown={disclosure.assetBreakdown} />
            </div>
          )}
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="label-ko text-dim">전과 {String(disclosure.criminalRecords.length).padStart(2, '0')}건</p>
            {disclosure.criminalRecords.length === 0 ? (
              <p className="text-ink/70">공개 자료 없음</p>
            ) : (
              <ul className="mt-1 space-y-1 text-ink/85">
                {disclosure.criminalRecords.map((r, i) => (
                  <li key={i}>{r.year}년 · {r.law} · {r.outcome}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="label-ko text-dim">체납 {String(disclosure.taxArrears.length).padStart(2, '0')}건</p>
            {disclosure.taxArrears.length === 0 ? (
              <p className="text-ink/70">공개 자료 없음</p>
            ) : (
              <ul className="mt-1 space-y-1.5 text-ink/85">
                {disclosure.taxArrears.map((r, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums">{r.year}년 · {formatKrwShort(r.amountKrw)}</span>
                    <NeutralBadge tone={r.status === 'paid' ? 'info' : 'attention'}>
                      {r.status === 'paid' ? '완납' : '미납'}
                    </NeutralBadge>
                    {r.note ? <span className="text-dim">· {r.note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 5년 납세 요약 (NEC 정형 자료) */}
          {typeof disclosure.fiveYearTaxPaidKrw === 'number'
            || typeof disclosure.currentTaxArrearsKrw === 'number'
            || typeof disclosure.fiveYearTaxArrearsKrw === 'number' ? (
            <div>
              <p className="label-ko text-dim">최근 5년 납세 (NEC 요약)</p>
              <ul className="mt-1 space-y-1 text-ink/85">
                {typeof disclosure.fiveYearTaxPaidKrw === 'number' ? (
                  <li className="tabular-nums">
                    5년 납부액 · <span className="text-ink">{formatKrwShort(disclosure.fiveYearTaxPaidKrw)}</span>
                  </li>
                ) : null}
                {typeof disclosure.fiveYearTaxArrearsKrw === 'number' ? (
                  <li className="tabular-nums">
                    5년 체납액 ·{' '}
                    <span className={disclosure.fiveYearTaxArrearsKrw === 0 ? 'text-ink/70' : 'text-ink'}>
                      {formatKrwShort(disclosure.fiveYearTaxArrearsKrw)}
                    </span>
                  </li>
                ) : null}
                {typeof disclosure.currentTaxArrearsKrw === 'number' ? (
                  <li className="tabular-nums">
                    현체납액 ·{' '}
                    <span className={disclosure.currentTaxArrearsKrw === 0 ? 'text-ink/70' : 'text-ink'}>
                      {formatKrwShort(disclosure.currentTaxArrearsKrw)}
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {/* 전과 요약 (TIF detail 미수집 시) */}
          {disclosure.criminalRecords.length === 0
            && typeof disclosure.criminalRecordCountSummary === 'number'
            && disclosure.criminalRecordCountSummary > 0 ? (
            <div>
              <p className="label-ko text-dim">전과 요약 (NEC)</p>
              <p className="text-ink/85">
                전과기록 <span className="tabular-nums text-ink">{disclosure.criminalRecordCountSummary}건</span> 공개됨
              </p>
              <p className="label-ko mt-0.5 text-dim">
                상세(연도·죄명·결과)는 NEC 등록서류 스캔 자료에 있으며, 운영자 검수 후 추가 표시됩니다.
              </p>
            </div>
          ) : null}
          <div>
            <p className="label-ko text-dim">병역</p>
            <p className="leading-relaxed text-ink/85">{disclosure.militaryRecord}</p>
            {disclosure.militarySummary ? (
              <p className="label-ko mt-1 text-dim">
                요약: <span className="text-ink/80">{disclosure.militarySummary}</span> · 공개자료 기준
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {sourceUrl ? (
        <div className="mt-5 border-t border-hair pt-4">
          <SourceLink href={sourceUrl} basisDate={basis} />
        </div>
      ) : null}
    </section>
  );
}

/**
 * #14 PR 4 — peti 정밀 분해 표시.
 * #14 §2-2 결정 D: 증감은 단순 수치 + 단색 회색 + "작년 대비" 라벨. 색상·화살표 강조 없음.
 * #14 §2-2 결정 A: 부동산 시·도 + 건수만 (시·군·구 비표시).
 * #14 §2-2 결정 B: 본인 단독 + 본인+가족 통합 2단 표기. 구성원별 비표시.
 */
function PetiBreakdownView({ breakdown }: { breakdown: AssetCategoryBreakdown }) {
  const familyDelta = breakdown.selfPlusFamilyKrw - breakdown.selfOnlyKrw;
  return (
    <div className="mt-4 space-y-3 text-sm">
      <div className="border-t border-hair-soft pt-3">
        <p className="label-ko text-dim">본인 / 본인+가족 합계</p>
        <ul className="mt-1 space-y-0.5 tabular-nums text-ink/85">
          <li>본인 단독 · <span className="text-ink">{formatKrwShort(breakdown.selfOnlyKrw)}</span></li>
          <li>본인 + 가족 · <span className="text-ink">{formatKrwShort(breakdown.selfPlusFamilyKrw)}</span></li>
          {familyDelta > 0 ? (
            <li className="label-ko text-dim">
              (가족 합계 · <span className="text-ink/80">{formatKrwShort(familyDelta)}</span>)
            </li>
          ) : null}
        </ul>
      </div>

      <div className="border-t border-hair-soft pt-3">
        <p className="label-ko text-dim">카테고리별 (작년 대비)</p>
        <ul className="mt-1 space-y-0.5">
          {breakdown.categories.map((c) => (
            <li key={c.name} className="flex flex-wrap items-baseline justify-between gap-2 tabular-nums">
              <span className="text-ink/85">{c.name} · {c.itemCount}건</span>
              <span className="text-ink">{formatKrwShort(c.totalKrw)}</span>
              {typeof c.yearOverYearChangeKrw === 'number' && c.yearOverYearChangeKrw !== 0 ? (
                <span className="label-ko basis-full text-right text-dim">
                  작년 대비 {c.yearOverYearChangeKrw > 0 ? '+' : ''}
                  {formatKrwShort(c.yearOverYearChangeKrw)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {breakdown.realEstateRegions && breakdown.realEstateRegions.length > 0 ? (
        <div className="border-t border-hair-soft pt-3">
          <p className="label-ko text-dim">부동산 소재 (시·도)</p>
          <ul className="mt-1 space-y-0.5 text-ink/85">
            {breakdown.realEstateRegions.map((r) => (
              <li key={r.region}>{r.region} · {r.itemCount}건</li>
            ))}
          </ul>
          <p className="label-ko mt-1 text-dim">
            ※ 시·군·구·정확 주소는 비공개 (privacy 보호).
          </p>
        </div>
      ) : null}

      <p className="label-ko border-t border-hair-soft pt-2 text-dim">
        출처: {breakdown.publicNoticeNo} · 공개 {breakdown.disclosedAt} · 기준 {breakdown.asOf}
      </p>
    </div>
  );
}
