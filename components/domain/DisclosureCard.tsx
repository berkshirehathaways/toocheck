import { cn } from '@/lib/utils';
import { formatKrwShort } from '@/lib/format-krw';
import { formatSourceBasis } from '@/lib/format-date';
import type { CandidateDisclosure } from '@/types/domain';

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
          <div className="mt-4">
            <AssetBreakdownBar breakdown={disclosure.assetBreakdown} />
          </div>
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
