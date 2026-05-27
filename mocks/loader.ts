// 시드 in-memory loader. 모든 함수는 동기·순수이며, 반환값은 deep clone (UI에서 mutate 방지).
// PR-3에서 도메인 유틸이 추가되면 일부 계산(asset rank/specificity avg/badges/checkPriority)을
// `lib/*`로 추출 예정. 현재는 자체 구현으로 격리.

import type {
  BadgeKind,
  Candidate,
  CandidateCheckCard,
  CandidateDisclosure,
  CandidatePromise,
  CompareRow,
  District,
  Election,
} from '@/types/domain';

import {
  candidates as seedCandidates,
  checkCards as seedCheckCards,
  disclosures as seedDisclosures,
  districts as seedDistricts,
  elections as seedElections,
  promises as seedPromises,
} from './seed';

function clone<T>(v: T): T {
  return structuredClone(v);
}

export function listElections(opts?: { includeArchived?: boolean }): Election[] {
  const includeArchived = opts?.includeArchived ?? false;
  return clone(
    seedElections.filter((e) => includeArchived || e.status !== 'archived')
  );
}

export function getElection(id: string): Election | null {
  const found = seedElections.find((e) => e.id === id);
  return found ? clone(found) : null;
}

export function listDistricts(electionId: string): District[] {
  return clone(seedDistricts.filter((d) => d.electionId === electionId));
}

export function getDistrict(id: string): District | null {
  const found = seedDistricts.find((d) => d.id === id);
  return found ? clone(found) : null;
}

export function listCandidates(
  districtId: string,
  opts?: { includeUnreviewed?: boolean }
): Candidate[] {
  const includeUnreviewed = opts?.includeUnreviewed ?? true; // 결정 E16: 표시
  return clone(
    seedCandidates.filter((c) => {
      if (c.districtId !== districtId) return false;
      if (!includeUnreviewed && c.reviewStatus !== 'reviewed') return false;
      return true;
    })
  );
}

export function getCandidate(id: string): Candidate | null {
  const found = seedCandidates.find((c) => c.id === id);
  return found ? clone(found) : null;
}

export function getDisclosure(candidateId: string): CandidateDisclosure | null {
  const found = seedDisclosures.find((d) => d.candidateId === candidateId);
  return found ? clone(found) : null;
}

export function listPromises(candidateId: string): CandidatePromise[] {
  return clone(
    seedPromises
      .filter((p) => p.candidateId === candidateId)
      .sort((a, b) => a.orderNo - b.orderNo)
  );
}

export function listCheckCards(candidateId: string): CandidateCheckCard[] {
  return clone(seedCheckCards.filter((c) => c.candidateId === candidateId));
}

// ===== 합성 데이터 =====

const SEVERITY_WEIGHT_CRIMINAL: Record<string, number> = {
  info: 0,
  check: 30,
  high_attention: 50,
};
const SEVERITY_WEIGHT_TAX: Record<string, number> = {
  info: 0,
  check: 25,
  high_attention: 45,
};
const SEVERITY_WEIGHT_ASSET: Record<string, number> = {
  info: 0,
  check: 15,
  high_attention: 25,
};
const SEVERITY_WEIGHT_SPECIFICITY_LOW = 20;
const SEVERITY_WEIGHT_SOURCE_MISSING = 10;

function computeCheckPriority(cards: CandidateCheckCard[]): {
  score: number;
  label: string;
} {
  let score = 0;
  for (const c of cards) {
    if (c.type === 'criminal_record') {
      score += SEVERITY_WEIGHT_CRIMINAL[c.severity] ?? 0;
    } else if (c.type === 'tax_arrears') {
      score += SEVERITY_WEIGHT_TAX[c.severity] ?? 0;
    } else if (c.type === 'asset') {
      score += SEVERITY_WEIGHT_ASSET[c.severity] ?? 0;
    } else if (c.type === 'promise_specificity' && c.severity === 'high_attention') {
      score += SEVERITY_WEIGHT_SPECIFICITY_LOW;
    } else if (c.type === 'source_missing') {
      score += SEVERITY_WEIGHT_SOURCE_MISSING;
    }
  }
  score = Math.min(score, 160);
  // 결정 D4
  const label =
    score <= 30
      ? '기본 공개자료 확인 완료'
      : score <= 70
        ? '확인할 항목이 일부 있음'
        : '확인할 항목이 많음';
  return { score, label };
}

function collectBadges(
  disclosure: CandidateDisclosure | null,
  cards: CandidateCheckCard[],
  promises: CandidatePromise[],
  assetInTopQuintile: boolean,
  reviewStatus: Candidate['reviewStatus']
): BadgeKind[] {
  if (reviewStatus !== 'reviewed') return ['data_pending'];
  const badges: BadgeKind[] = [];
  const hasCriminal =
    disclosure?.criminalRecords && disclosure.criminalRecords.length > 0;
  const hasTax = disclosure?.taxArrears && disclosure.taxArrears.length > 0;
  if (hasCriminal) badges.push('criminal_record_present');
  if (hasTax) badges.push('tax_arrears_present');
  if (assetInTopQuintile) badges.push('asset_top_quintile');
  if (disclosure?.militaryRecord) badges.push('military_disclosed');
  const avg = avgSpecificity(promises);
  if (avg >= 4) badges.push('promise_specificity_high');
  return badges;
}

function avgSpecificity(promises: CandidatePromise[]): number {
  if (promises.length === 0) return 0;
  const sum = promises.reduce((acc, p) => acc + p.specificityScore, 0);
  return Math.round((sum / promises.length) * 10) / 10; // 결정 D7: 소수 1자리
}

function computeAssetRanks(
  districtCandidates: Candidate[],
  getDisc: (id: string) => CandidateDisclosure | null
): Map<string, { rank: number; topQuintile: boolean }> {
  // needs_check 후보 제외 (결정 C6 정신)
  const reviewed = districtCandidates.filter((c) => c.reviewStatus === 'reviewed');
  const withAsset = reviewed
    .map((c) => ({ id: c.id, asset: getDisc(c.id)?.assetTotal ?? null }))
    .filter((x): x is { id: string; asset: number } => x.asset !== null)
    .sort((a, b) => b.asset - a.asset);

  const n = withAsset.length;
  const topQuintileCount = Math.max(1, Math.ceil(n * 0.2)); // 결정 D3: 상위 20%
  const out = new Map<string, { rank: number; topQuintile: boolean }>();
  withAsset.forEach((x, i) => {
    out.set(x.id, { rank: i + 1, topQuintile: i < topQuintileCount });
  });
  return out;
}

export function getCompareData(districtId: string): CompareRow[] {
  const cs = seedCandidates.filter((c) => c.districtId === districtId);
  const getDisc = (id: string): CandidateDisclosure | null => {
    const d = seedDisclosures.find((x) => x.candidateId === id);
    return d ? clone(d) : null;
  };
  const assetRanks = computeAssetRanks(cs, getDisc);

  const rows: CompareRow[] = cs.map((cand) => {
    const disclosure = getDisc(cand.id);
    const promisesForCand = seedPromises.filter((p) => p.candidateId === cand.id);
    const cardsForCand = seedCheckCards.filter((c) => c.candidateId === cand.id);
    const rankInfo = assetRanks.get(cand.id) ?? null;
    const assetInTopQuintile = rankInfo?.topQuintile ?? false;
    const badges = collectBadges(
      disclosure,
      cardsForCand,
      promisesForCand,
      assetInTopQuintile,
      cand.reviewStatus
    );
    const { score, label } = computeCheckPriority(cardsForCand);
    return {
      candidate: clone(cand),
      disclosure,
      promiseCount: promisesForCand.length,
      avgSpecificity: avgSpecificity(promisesForCand),
      assetRankInDistrict: rankInfo?.rank ?? null,
      assetInTopQuintile,
      badges,
      checkPriorityScore: score,
      checkPriorityLabel: label,
    };
  });
  return rows;
}

// ===== District 자료 기준일 (결정 C6: needs_check 제외, 최소값) =====

export function getDistrictSourceCheckedAt(districtId: string): string | null {
  const cs = seedCandidates.filter(
    (c) => c.districtId === districtId && c.reviewStatus === 'reviewed'
  );
  const dates = cs
    .map((c) => seedDisclosures.find((d) => d.candidateId === c.id)?.sourceCheckedAt)
    .filter((d): d is string => Boolean(d));
  if (dates.length === 0) return null;
  return dates.sort()[0] ?? null;
}
