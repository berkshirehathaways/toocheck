/**
 * #52 Phase 1 — 룩업용 roster 슬림 요약 생성.
 *
 * 입력: data/curated/roster-2026.json (~6MB, 7,335 후보)
 * 출력: data/curated/roster-summary.json (~750KB)
 *
 * 후보 1명마다 들고 있는 모든 필드를 시군구·시도·선거구 단위로 카운트·인덱싱하여
 * 런타임 룩업에서 한 번에 "이 시군구의 후보 N명, 광역의원 7명, 기초의원 12명" 같은
 * 정보를 즉시 반환할 수 있게 한다.
 *
 * 사용:
 *   pnpm tsx scripts/ingest/08-build-roster-summary.ts
 *   pnpm tsx scripts/ingest/08-build-roster-summary.ts --dry-run
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { OfficeKind } from '../../types/domain.js';

const ROSTER_PATH = resolve(process.cwd(), 'data/curated/roster-2026.json');
const OUT_PATH = resolve(process.cwd(), 'data/curated/roster-summary.json');

interface RosterCandidate {
  id: string;
  huboId?: string;
  jdId?: string;
  name: string;
  party: string;
  ballotNumber: number;
  sgTypecode: string;
  sgTypeName: string;
  officeKind: OfficeKind;
  sidoCode: string;
  sidoName: string;
  guCode: string;
  guName: string;
  sggId: string;
  sggName: string;
}

interface RosterFile {
  generatedAt: string;
  sgId: string;
  candidates: RosterCandidate[];
}

interface OfficeKindCounts {
  // OfficeKind → 후보 수
  [key: string]: number;
}

interface SigunguEntry {
  sidoCode: string;
  guCode: string;
  sidoName: string;
  guName: string;
  officeKindCounts: OfficeKindCounts;
  sggIds: Record<string, string[]>; // officeKind → unique sggIds[]
}

interface SidoEntry {
  sidoName: string;
  officeKindCounts: OfficeKindCounts;
  sggIds: Record<string, string[]>;
}

interface SggIndexEntry {
  officeKind: OfficeKind;
  sgTypecode: string;
  sidoCode: string;
  sidoName: string;
  guCode: string;
  guName: string;
  sggName: string;
  /** 이 선거구(sggId)에 등록된 후보 수. */
  candidateCount: number;
}

interface RosterSummary {
  version: number;
  generatedAt: string;
  sgId: string;
  totalCandidates: number;
  sidoCount: number;
  sigunguCount: number;
  sggCount: number;
  byKey: Record<string, SigunguEntry>; // "sidoCode|guCode"
  bySido: Record<string, SidoEntry>;
  sggIndex: Record<string, SggIndexEntry>;
}

// 시·도 단위 선거 (gu 없음): 시·도지사, 교육감, 광역비례
const SIDO_LEVEL_OFFICE_KINDS = new Set<OfficeKind>([
  'metropolitan_governor',
  'education_superintendent',
  'metropolitan_proportional',
]);

function bumpCount(counts: OfficeKindCounts, kind: OfficeKind): void {
  counts[kind] = (counts[kind] ?? 0) + 1;
}

function addUnique(arr: string[], value: string): void {
  if (value && !arr.includes(value)) arr.push(value);
}

function build(roster: RosterFile): RosterSummary {
  const byKey: Record<string, SigunguEntry> = {};
  const bySido: Record<string, SidoEntry> = {};
  const sggIndex: Record<string, SggIndexEntry> = {};

  for (const c of roster.candidates) {
    if (!c.officeKind) continue;
    const sidoCode = c.sidoCode ?? '';
    const sidoName = c.sidoName ?? '';
    const guCode = c.guCode ?? '';
    const guName = c.guName ?? '';
    const sggId = c.sggId ?? '';

    // 1) 시·도 단위
    if (!guCode || SIDO_LEVEL_OFFICE_KINDS.has(c.officeKind)) {
      let sido = bySido[sidoCode];
      if (!sido) {
        sido = { sidoName, officeKindCounts: {}, sggIds: {} };
        bySido[sidoCode] = sido;
      }
      bumpCount(sido.officeKindCounts, c.officeKind);
      const bucket = (sido.sggIds[c.officeKind] ??= []);
      addUnique(bucket, sggId);
    } else {
      // 2) 시·군·구 단위
      const key = `${sidoCode}|${guCode}`;
      let su = byKey[key];
      if (!su) {
        su = { sidoCode, guCode, sidoName, guName, officeKindCounts: {}, sggIds: {} };
        byKey[key] = su;
      }
      bumpCount(su.officeKindCounts, c.officeKind);
      const bucket = (su.sggIds[c.officeKind] ??= []);
      addUnique(bucket, sggId);
    }

    // 3) 선거구 인덱스
    if (sggId) {
      const existing = sggIndex[sggId];
      if (existing) {
        existing.candidateCount += 1;
      } else {
        sggIndex[sggId] = {
          officeKind: c.officeKind,
          sgTypecode: c.sgTypecode,
          sidoCode,
          sidoName,
          guCode,
          guName,
          sggName: c.sggName,
          candidateCount: 1,
        };
      }
    }
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    sgId: roster.sgId,
    totalCandidates: roster.candidates.length,
    sidoCount: Object.keys(bySido).length,
    sigunguCount: Object.keys(byKey).length,
    sggCount: Object.keys(sggIndex).length,
    byKey,
    bySido,
    sggIndex,
  };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const rosterRaw = readFileSync(ROSTER_PATH, 'utf-8');
  const roster = JSON.parse(rosterRaw) as RosterFile;
  console.log(`✓ Loaded roster: ${roster.candidates.length} candidates`);

  const summary = build(roster);
  console.log(
    `✓ Built summary: ${summary.sidoCount} 시·도 / ${summary.sigunguCount} 시·군·구 / ${summary.sggCount} 선거구`
  );

  const serialized = JSON.stringify(summary, null, 2);
  if (dryRun) {
    console.log('[dry-run] would write', OUT_PATH, `(${serialized.length} bytes)`);
    return;
  }

  writeFileSync(OUT_PATH, serialized, 'utf-8');
  console.log(`✓ Wrote ${OUT_PATH} (${serialized.length} bytes)`);
}

main();
