import {
  AssetBreakdownBar,
  CandidateCard,
  CheckCard,
  ChipDivider,
  DataPendingNote,
  DisclosureCard,
  HudLabel,
  LimeStamp,
  NeutralBadge,
  PromiseCard,
  RegistrationMarks,
  SourceLink,
  StatusChip,
} from '@/components/domain';
import { getCompareData, getDisclosure, listCandidates, listPromises } from '@/mocks/loader';
import { formatSourceBasis } from '@/lib/format-date';

export const metadata = { title: '디자인 시스템 카탈로그 (개발용)' };

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
  const basis = formatSourceBasis('2026-05-20');

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-6 py-10">
      <header className="border-b border-hair pb-6">
        <HudLabel tone="lime">디자인 시스템 카탈로그</HudLabel>
        <h1 className="display-ko mt-2 text-3xl font-bold text-ink">디자인 시스템 카탈로그</h1>
        <p className="mt-1 text-sm text-dim">도메인 컴포넌트의 모든 상태를 한 페이지에서 시각 검수합니다.</p>
      </header>

      <Section title="상태 칩 · HUD 라벨 · 라임 스탬프">
        <div className="flex flex-wrap gap-3">
          <StatusChip tone="live"><span>검수 완료</span><ChipDivider /><span>2026.05.20</span></StatusChip>
          <StatusChip tone="pending"><span>자료 확인 중</span><ChipDivider /><span>대기</span></StatusChip>
          <StatusChip tone="neutral"><span>출처</span><ChipDivider /><span>4건 등록</span></StatusChip>
          <HudLabel tone="cyan">공개 자료 04건</HudLabel>
          <HudLabel tone="lime">함께 확인할 지점</HudLabel>
          <LimeStamp>검수 완료 · 2026.05.20</LimeStamp>
        </div>
      </Section>

      <Section title="중립 배지 톤">
        <div className="flex flex-wrap gap-2">
          <NeutralBadge tone="neutral">중립</NeutralBadge>
          <NeutralBadge tone="muted">자료 확인 중</NeutralBadge>
          <NeutralBadge tone="info">정보</NeutralBadge>
          <NeutralBadge tone="check">확인 권장</NeutralBadge>
          <NeutralBadge tone="attention">주의 깊게 확인</NeutralBadge>
          <NeutralBadge tone="cyan">강조 (cyan)</NeutralBadge>
          <NeutralBadge tone="lime">강조 (lime)</NeutralBadge>
        </div>
      </Section>

      <Section title="확인 필요도 카드 · 3단계">
        <div className="grid gap-3 sm:grid-cols-3">
          <CheckCard severity="info" title="공개된 전과 기록 없음" body="공개된 공식 자료에 기재된 전과 기록이 없습니다." />
          <CheckCard severity="check" title="공개된 체납 기록 1건 (완납)" body="2019년 종합소득세 1,200만원 체납 후 완납한 공개 자료가 있습니다." sourceUrl="https://example.test" basisDate={basis} />
          <CheckCard severity="high_attention" title="공약 구체성 낮음" body="평균 구체성 점수가 1점 미만으로, 예산·기간·주체·지표 항목이 대부분 명시되지 않습니다." />
        </div>
      </Section>

      <Section title="자료 보류 안내 · 원문 링크 · 재산 구성 막대">
        <DataPendingNote />
        <SourceLink href="https://example.test/source" basisDate={basis} />
        <div className="hud-panel relative p-4"><RegistrationMarks color="dim" size={10} inset={6} /><AssetBreakdownBar breakdown={{ realEstate: 60, deposit: 25, securities: 12, other: 3 }} /></div>
      </Section>

      {disc1 ? (<Section title="공개 자료 카드 — 1번 후보"><DisclosureCard disclosure={disc1} /></Section>) : null}
      {disc3 ? (<Section title="공개 자료 카드 — 3번 후보 (체납 · 부동산 상위)"><DisclosureCard disclosure={disc3} /></Section>) : null}

      <Section title="공약 카드">
        <div className="grid gap-3 sm:grid-cols-2">
          {promises1.slice(0, 2).map((p, i) => <PromiseCard key={p.id} promise={p} index={i + 1} />)}
          {promises3.slice(0, 2).map((p, i) => <PromiseCard key={p.id} promise={p} index={i + 3} />)}
        </div>
      </Section>

      <Section title="후보 카드">
        <div className="grid gap-px bg-hair sm:grid-cols-2">
          {cand1 && row1 ? <CandidateCard candidate={cand1} row={row1} topPromises={promises1.slice(0, 2)} basisDate={basis} className="border-0" /> : null}
          {cand3 && row3 ? <CandidateCard candidate={cand3} row={row3} topPromises={promises3.slice(0, 2)} basisDate={basis} className="border-0" /> : null}
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="label-ko text-dim">· {title}</h2>
      {children}
    </section>
  );
}
