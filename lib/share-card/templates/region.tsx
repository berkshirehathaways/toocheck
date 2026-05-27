import type { CompareRow, District } from '@/types/domain';
import { COLORS, Disclaimer, Frame, Wordmark } from './common';

const TEN_EOK = 1_000_000_000;

interface RegionTemplateProps {
  district: District;
  rows: CompareRow[];
  basisDate: string;
}

// 결정 D8: 10억 임계값, 결정 B4: 후보 식별은 기호만 (정당명·이름 미노출).
export function RegionTemplate({ district, rows, basisDate }: RegionTemplateProps) {
  const reviewed = rows.filter((r) => r.candidate.reviewStatus === 'reviewed');
  const richN = reviewed.filter((r) => (r.disclosure?.assetTotal ?? 0) >= TEN_EOK).length;
  const criminalN = reviewed.filter((r) => (r.disclosure?.criminalRecords.length ?? 0) > 0).length;
  const taxN = reviewed.filter((r) => (r.disclosure?.taxArrears.length ?? 0) > 0).length;
  const total = reviewed.length;
  return (
    <Frame>
      <Wordmark />
      <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ fontSize: 24, color: COLORS.muted }}>지역 요약 · {basisDate}</span>
        <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1, lineHeight: 1.15 }}>
          {district.name}
        </span>
      </div>
      <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <Row label="검수 완료 후보" value={`${total}명`} />
        <Row label="재산신고액 10억 원 이상" value={`${richN}명`} />
        <Row label="전과 공개자료 있음" value={`${criminalN}명`} />
        <Row label="체납 공개자료 있음" value={`${taxN}명`} />
      </div>
      <Disclaimer />
    </Frame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: 28, color: COLORS.muted }}>{label}</span>
      <span style={{ fontSize: 48, fontWeight: 700, color: COLORS.fg }}>{value}</span>
    </div>
  );
}
