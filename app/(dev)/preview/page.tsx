import {
  AssetBreakdownBar,
  CandidateCard,
  CheckCard,
  DataPendingNote,
  DisclosureCard,
  NeutralBadge,
  PromiseCard,
  SourceLink,
} from '@/components/domain';
import { getCompareData, getDisclosure, listCandidates, listPromises } from '@/mocks/loader';

export const metadata = {
  title: '디자인 시스템 카탈로그 (dev)',
  description: '도메인 컴포넌트 시각 검수용 — 라우트 그룹 (dev)',
};

export default function PreviewPage() {
  const candidates = listCandidates('district_sample_ga');
  const rows = getCompareData('district_sample_ga');
  const cand1 = candidates.find((c) => c.id === 'cand_001');
  const cand3 = candidates.find((c) => c.id === 'cand_003');
  const row1 = rows.find((r) => r.candidate.id === 'cand_001');
  const row3 = rows.find((r) => r.candidate.id === 'cand_003');
  const disc1 = getDisclosure('cand_001');
  const disc3 = getDisclosure('cand_003');
  const promises1 = listPromises('cand_001');
  const promises3 = listPromises('cand_003');

  return (
    <main className="mx-auto max-w-4xl space-y-12 p-6">
      <header className="border-b border-border pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">dev only</p>
        <h1 className="text-2xl font-semibold">디자인 시스템 카탈로그</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          도메인 컴포넌트의 모든 상태를 한 페이지에서 시각 검수합니다. shadcn primitives는 별도.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. NeutralBadge</h2>
        <div className="flex flex-wrap gap-2">
          <NeutralBadge tone="neutral">중립</NeutralBadge>
          <NeutralBadge tone="info">정보</NeutralBadge>
          <NeutralBadge tone="check">확인 권장</NeutralBadge>
          <NeutralBadge tone="attention">주의 깊게 확인</NeutralBadge>
          <NeutralBadge tone="muted">자료 확인 중</NeutralBadge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. CheckCard (severity 3종)</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <CheckCard
            severity="info"
            title="공개된 전과 기록 없음"
            body="공개된 공식 자료에 기재된 전과 기록이 없습니다."
          />
          <CheckCard
            severity="check"
            title="공개된 체납 기록 1건 (완납)"
            body="2019년 종합소득세 1,200만원 체납 후 완납한 공개 자료가 있습니다."
            sourceUrl="https://example.test/disclosure/cand_003#tax"
            basisDate="2026년 5월 18일 기준"
          />
          <CheckCard
            severity="high_attention"
            title="공약 구체성 낮음"
            body="평균 구체성 점수가 1점 미만으로, 예산·기간·주체·지표 항목이 대부분 명시되지 않습니다."
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. DataPendingNote · SourceLink</h2>
        <DataPendingNote />
        <SourceLink href="https://example.test/source" basisDate="2026년 5월 20일 기준" />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. AssetBreakdownBar</h2>
        <div className="rounded-lg border border-border bg-card p-4">
          <AssetBreakdownBar breakdown={{ realEstate: 60, deposit: 25, securities: 12, other: 3 }} />
        </div>
      </section>

      {disc1 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. DisclosureCard (1번 후보)</h2>
          <DisclosureCard disclosure={disc1} />
        </section>
      ) : null}

      {disc3 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. DisclosureCard (3번 후보 · 체납 + 부동산 상위)</h2>
          <DisclosureCard disclosure={disc3} />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">7. PromiseCard (기본 펼침 + 더보기)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {promises1.slice(0, 2).map((p) => (
            <PromiseCard key={p.id} promise={p} />
          ))}
          {promises3.slice(0, 2).map((p) => (
            <PromiseCard key={p.id} promise={p} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">8. CandidateCard (목록용)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {cand1 && row1 ? (
            <CandidateCard candidate={cand1} row={row1} topPromises={promises1.slice(0, 2)} />
          ) : null}
          {cand3 && row3 ? (
            <CandidateCard candidate={cand3} row={row3} topPromises={promises3.slice(0, 2)} />
          ) : null}
        </div>
      </section>
    </main>
  );
}
