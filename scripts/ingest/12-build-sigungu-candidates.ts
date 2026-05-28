/**
 * #52 — 시·군·구별 후보 인덱스 빌더 (시군구 검색 UX의 핵심 데이터).
 *
 * 입력: data/curated/roster-2026.json (전국 7,335 후보)
 * 출력: data/curated/sigungu-candidates.json
 *
 * "양천구" 검색 → 그 시·군·구의 모든 후보를 선거별로 묶어 보여주기 위한 슬림 인덱스.
 *   sido[시도명]    : 시·도지사·교육감·광역비례 (시·도 단위 선거)
 *   sigungu[시도|시군구] : 구·시·군의 장·시·도의원·구·시·군의원·기초비례 (시·군·구 단위)
 *
 * 통합 시·도(전남광주통합특별시)는 시·도 단위 선거가 통합명으로 등록되므로
 * sido 인덱스에 통합명으로 저장 + 물리 시·도명(광주광역시/전라남도)으로도 alias 저장.
 *
 * 사용:
 *   pnpm tsx scripts/ingest/10-build-sigungu-candidates.ts [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { OfficeKind } from '../../types/domain.js';

const ROSTER_PATH = resolve(process.cwd(), 'data/curated/roster-2026.json');
const OUT_PATH = resolve(process.cwd(), 'data/curated/sigungu-candidates.json');

interface RosterCandidate {
  name: string;
  party: string;
  ballotNumber: number;
  proportionalCount: number;
  officeKind: OfficeKind;
  sidoName: string;
  guCode: string;
  guName: string;
  sggId: string;
  sggName: string;
}

// 통합 시·도명 (시·군·구 단위 선거가 이 이름으로 등록될 수 있음 → 물리 시·도로 재매핑)
const INTEGRATION_SIDO = new Set(['전남광주통합특별시']);

interface CandidateLite {
  name: string;
  party: string;
  ballotNumber: number;
  sggId: string;
  sggName: string;
  proportionalCount?: number;
}

const SIDO_LEVEL = new Set<OfficeKind>([
  'metropolitan_governor',
  'education_superintendent',
  'metropolitan_proportional',
]);

// 통합 시·도 → 물리 시·도 alias (시·도 단위 선거를 물리 시·도명으로도 조회 가능하게)
const INTEGRATION_ALIAS: Record<string, string[]> = {
  전남광주통합특별시: ['광주광역시', '전라남도'],
};

function lite(c: RosterCandidate): CandidateLite {
  const o: CandidateLite = {
    name: c.name,
    party: c.party,
    ballotNumber: c.ballotNumber,
    sggId: c.sggId,
    sggName: c.sggName,
  };
  if (c.proportionalCount) o.proportionalCount = c.proportionalCount;
  return o;
}

function sortCands(arr: CandidateLite[]): CandidateLite[] {
  return arr.sort(
    (a, b) => a.sggName.localeCompare(b.sggName, 'ko') || a.ballotNumber - b.ballotNumber
  );
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const roster = JSON.parse(readFileSync(ROSTER_PATH, 'utf-8')) as { candidates: RosterCandidate[] };

  const sido: Record<string, Partial<Record<OfficeKind, CandidateLite[]>>> = {};
  const sigungu: Record<string, Partial<Record<OfficeKind, CandidateLite[]>>> = {};

  // guCode → 물리 시·도명 (통합 시·도가 아닌 후보 기준). 통합명으로 등록된 시·군·구 선거를
  // 물리 시·도로 재매핑하기 위함. guCode는 전국 유일(시도+구 인코딩).
  const physicalSidoByGuCode: Record<string, string> = {};
  for (const c of roster.candidates) {
    if (c.guCode && !INTEGRATION_SIDO.has(c.sidoName) && !physicalSidoByGuCode[c.guCode]) {
      physicalSidoByGuCode[c.guCode] = c.sidoName;
    }
  }

  for (const c of roster.candidates) {
    if (!c.officeKind) continue;
    if (SIDO_LEVEL.has(c.officeKind)) {
      const bucket = (sido[c.sidoName] ??= {});
      (bucket[c.officeKind] ??= []).push(lite(c));
    } else {
      // 통합명으로 등록된 시·군·구 선거(예: 전남 순천 시·도의원)는 물리 시·도로 재매핑
      const effSido = INTEGRATION_SIDO.has(c.sidoName)
        ? (physicalSidoByGuCode[c.guCode] ?? c.sidoName)
        : c.sidoName;
      const key = `${effSido}|${c.guName}`;
      const bucket = (sigungu[key] ??= {});
      (bucket[c.officeKind] ??= []).push(lite(c));
    }
  }

  // 정렬 + alias 확장
  for (const b of Object.values(sido)) for (const k of Object.keys(b)) sortCands(b[k as OfficeKind]!);
  for (const b of Object.values(sigungu)) for (const k of Object.keys(b)) sortCands(b[k as OfficeKind]!);
  for (const [unified, aliases] of Object.entries(INTEGRATION_ALIAS)) {
    if (sido[unified]) for (const a of aliases) sido[a] = sido[unified];
  }

  // 시·군·구 자동완성 목록 (sido, sigungu) — 후보 데이터 없이 이름만
  const sigunguList = Object.keys(sigungu)
    .map((k) => {
      const [s, g] = k.split('|');
      return { sido: s ?? '', sigungu: g ?? '' };
    })
    .sort((a, b) => (a.sido + a.sigungu).localeCompare(b.sido + b.sigungu, 'ko'));

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    sgId: '20260603',
    sidoCount: Object.keys(sido).length,
    sigunguCount: sigunguList.length,
    sigunguList,
    sido,
    sigungu,
  };

  const serialized = JSON.stringify(output);
  if (dryRun) {
    console.log(`[dry-run] sido ${output.sidoCount} / 시군구 ${output.sigunguCount} / ${serialized.length} bytes`);
    return;
  }
  writeFileSync(OUT_PATH, serialized, 'utf-8');
  console.log(`✓ Wrote ${OUT_PATH} (${serialized.length} bytes)`);
  console.log(`  시·도 ${output.sidoCount} / 시·군·구 ${output.sigunguCount}`);
}

main();
