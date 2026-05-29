import type { Candidate, CompareRow } from '@/types/domain';
import { formatKrwShort } from '@/lib/format-krw';
import { COLORS, Disclaimer, Frame, Wordmark } from './common';

// 결정 B4: 후보 식별은 기호만 (이름·정당명 카드에 노출하지 않음).
interface CandidateTemplateProps {
  candidate: Candidate;
  row: CompareRow;
  basisDate: string;
}

export function CandidateTemplate({ candidate, row, basisDate }: CandidateTemplateProps) {
  const pending = candidate.reviewStatus !== 'reviewed';
  return (
    <Frame>
      <Wordmark />
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 22, color: COLORS.muted }}>후보 요약 · {basisDate}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
          <span
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: -1,
              background: COLORS.fg,
              color: COLORS.bg,
              padding: '4px 24px',
              borderRadius: 16,
            }}
          >
            기호 {candidate.ballotNumber}
          </span>
        </div>
      </div>

      {/* Satori는 flex 컬럼의 Fragment 자식을 평탄화하지 못해 행이 가로로 붕괴한다.
          조건부를 각 행에 분산해 직접 자식으로 둔다. */}
      <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {pending ? (
          <span style={{ fontSize: 28, color: COLORS.muted }}>자료 확인 중인 후보입니다.</span>
        ) : null}
        {!pending ? (
          <RowItem label="재산신고액" value={formatKrwShort(row.disclosure?.assetTotal ?? null)} />
        ) : null}
        {!pending ? (
          <RowItem
            label="전과 공개"
            value={(row.disclosure?.criminalRecords.length ?? 0) > 0 ? '있음' : '없음'}
          />
        ) : null}
        {!pending ? (
          <RowItem
            label="체납 공개"
            value={(row.disclosure?.taxArrears.length ?? 0) > 0 ? '있음' : '없음'}
          />
        ) : null}
      </div>
      <Disclaimer />
    </Frame>
  );
}

function RowItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 28, color: COLORS.muted }}>{label}</span>
      <span style={{ fontSize: 40, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
