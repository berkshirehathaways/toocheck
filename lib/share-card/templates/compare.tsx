import type { CompareRow, District } from '@/types/domain';
import { formatKrwShort } from '@/lib/format-krw';
import { COLORS, Disclaimer, Frame, Wordmark } from './common';

interface CompareTemplateProps {
  district: District;
  rows: CompareRow[];
  basisDate: string;
}

// 결정 B4: 기호만 노출.
export function CompareTemplate({ district, rows, basisDate }: CompareTemplateProps) {
  const reviewed = rows.filter((r) => r.candidate.reviewStatus === 'reviewed');
  return (
    <Frame>
      <Wordmark />
      <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 22, color: COLORS.muted }}>비교 요약 · {basisDate}</span>
        <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -0.8 }}>
          {district.name}
        </span>
      </div>

      <div
        style={{
          marginTop: 36,
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${COLORS.hairline}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <Header />
        {reviewed.map((r, i) => (
          <Row
            key={r.candidate.id}
            ballotNumber={r.candidate.ballotNumber}
            asset={formatKrwShort(r.disclosure?.assetTotal ?? null)}
            criminal={(r.disclosure?.criminalRecords.length ?? 0) > 0 ? '있음' : '없음'}
            tax={(r.disclosure?.taxArrears.length ?? 0) > 0 ? '있음' : '없음'}
            zebra={i % 2 === 1}
          />
        ))}
      </div>
      <Disclaimer />
    </Frame>
  );
}

function Header() {
  return (
    <div
      style={{
        display: 'flex',
        background: '#f4f5f7',
        padding: '14px 20px',
        fontSize: 18,
        color: COLORS.muted,
        fontWeight: 700,
      }}
    >
      <Cell w={140}>기호</Cell>
      <Cell w={240}>재산총액</Cell>
      <Cell w={160}>전과 공개</Cell>
      <Cell w={160}>체납 공개</Cell>
    </div>
  );
}

function Row({
  ballotNumber,
  asset,
  criminal,
  tax,
  zebra,
}: {
  ballotNumber: number;
  asset: string;
  criminal: string;
  tax: string;
  zebra: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        padding: '18px 20px',
        fontSize: 24,
        background: zebra ? '#fbfbfc' : COLORS.bg,
      }}
    >
      <Cell w={140}>
        <span style={{ fontWeight: 700 }}>{ballotNumber}</span>
      </Cell>
      <Cell w={240}>{asset}</Cell>
      <Cell w={160}>{criminal}</Cell>
      <Cell w={160}>{tax}</Cell>
    </div>
  );
}

function Cell({ children, w }: { children: React.ReactNode; w: number }) {
  return (
    <div style={{ width: w, display: 'flex', alignItems: 'center' }}>{children}</div>
  );
}
