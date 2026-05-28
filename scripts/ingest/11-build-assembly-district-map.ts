/**
 * #52 — 행정동 → 광역의원/기초의원 선거구 매핑 빌더 (전국, 법령 권위 기반).
 *
 * 입력:
 *   - data/raw/assembly-districts/*.csv  (`_` 프리픽스 제외)
 *       헤더: sido,kind,sggName,hdong[,sourceUrl]
 *       kind = metropolitan(시·도의원) | basic(구·시·군의원)
 *       sggName = 선거구명 (별표 표기 그대로, 공백 허용 — 정규화는 빌더가 수행)
 *       hdong   = 행정동/읍·면명 (별표 표기 그대로)
 *       · 광역의원: scripts/ingest/parse_byeolpyo2.py 가 공직선거법 별표2에서 생성
 *       · 기초의원: 각 시·도 조례 별표에서 생성 (parse_byeolpyo_gicho.py / 수기 CSV)
 *   - data/curated/roster-summary.json  (선거구명 → sggId/guName/후보수 해결)
 *   - data/curated/bcode-to-hdong.json  (법정동코드 → 행정동명, byBcode 보강)
 *
 * 출력: data/curated/assembly-district-map.json
 *   byBcode: 법정동코드 → { metropolitanSggId..., basicSggId... }
 *   byName : "시·도명|시·군·구명|정규화행정동명" → 동일 구조
 *
 * 선거구명 해결: (sido, officeKind, normalizeSggName) → sggId 는 시·도 내 유일하므로
 * 시·군·구명 없이 해결 가능. guName(일반구 포함 정확)·후보수는 roster에서 가져온다.
 *
 * 사용:
 *   pnpm tsx scripts/ingest/11-build-assembly-district-map.ts
 *   pnpm tsx scripts/ingest/11-build-assembly-district-map.ts --dry-run
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { normalizeDong, normalizeSggName } from '../../lib/district/normalize.js';

const ROSTER_SUMMARY_PATH = resolve(process.cwd(), 'data/curated/roster-summary.json');
const BCODE_MAP_PATH = resolve(process.cwd(), 'data/curated/bcode-to-hdong.json');
const OUT_PATH = resolve(process.cwd(), 'data/curated/assembly-district-map.json');
const CSV_DIR = resolve(process.cwd(), 'data/raw/assembly-districts');

type OfficeKind = 'metropolitan_member' | 'basic_member';

interface AssemblyEntry {
  metropolitanSggId?: string;
  metropolitanSggName?: string;
  metropolitanCandidateCount?: number;
  basicSggId?: string;
  basicSggName?: string;
  basicCandidateCount?: number;
  sourceUrls?: string[];
  needsReview?: boolean;
}

interface RosterSummaryFile {
  sggIndex: Record<
    string,
    {
      officeKind: string;
      sggName: string;
      sidoName: string;
      guName: string;
      candidateCount: number;
    }
  >;
}

interface BcodeMapFile {
  byBcode: Record<string, { sido: string; sigungu: string; bname: string; hname: string }>;
}

interface ResolvedSgg {
  sggId: string;
  guName: string;
  candidateCount: number;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

/** (sido, officeKind, normSggName) → {sggId, guName, candidateCount} */
function buildSggResolver(roster: RosterSummaryFile): Map<string, ResolvedSgg> {
  const m = new Map<string, ResolvedSgg>();
  for (const [sggId, info] of Object.entries(roster.sggIndex)) {
    if (info.officeKind !== 'metropolitan_member' && info.officeKind !== 'basic_member') continue;
    const key = `${info.sidoName}|${info.officeKind}|${normalizeSggName(info.sggName)}`;
    m.set(key, { sggId, guName: info.guName, candidateCount: info.candidateCount });
  }
  return m;
}

interface CsvRow {
  sido: string;
  officeKind: OfficeKind;
  sggName: string;
  hdong: string;
  sourceUrl?: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0]!.split(',').map((c) => c.trim());
  const idx = {
    sido: header.indexOf('sido'),
    kind: header.indexOf('kind'),
    sggName: header.indexOf('sggName'),
    hdong: header.indexOf('hdong'),
    sourceUrl: header.indexOf('sourceUrl'),
  };
  if ([idx.sido, idx.kind, idx.sggName, idx.hdong].some((i) => i < 0)) {
    throw new Error(`CSV header needs sido,kind,sggName,hdong. got: ${header.join(',')}`);
  }
  const rows: CsvRow[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = line.split(',').map((c) => c.trim());
    const kind = cells[idx.kind];
    if (kind !== 'metropolitan' && kind !== 'basic') continue;
    rows.push({
      sido: cells[idx.sido] ?? '',
      officeKind: kind === 'metropolitan' ? 'metropolitan_member' : 'basic_member',
      sggName: cells[idx.sggName] ?? '',
      hdong: cells[idx.hdong] ?? '',
      sourceUrl: idx.sourceUrl >= 0 ? cells[idx.sourceUrl] : undefined,
    });
  }
  return rows;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const roster = readJson<RosterSummaryFile>(ROSTER_SUMMARY_PATH);
  const bcodeMap = readJson<BcodeMapFile>(BCODE_MAP_PATH);
  const resolver = buildSggResolver(roster);

  const byName: Record<string, AssemblyEntry> = {};
  const coverageSet = new Set<string>(); // "시도 시군구"
  const warnings: string[] = [];
  let rowCount = 0;
  let unresolved = 0;

  const files = existsSync(CSV_DIR)
    ? readdirSync(CSV_DIR).filter((f) => f.endsWith('.csv') && !f.startsWith('_'))
    : [];

  const ensure = (key: string): AssemblyEntry => {
    const e = byName[key];
    if (e) return e;
    const fresh: AssemblyEntry = { sourceUrls: [], needsReview: false };
    byName[key] = fresh;
    return fresh;
  };

  for (const f of files) {
    const rows = parseCsv(readFileSync(resolve(CSV_DIR, f), 'utf-8'));
    for (const r of rows) {
      rowCount += 1;
      const rkey = `${r.sido}|${r.officeKind}|${normalizeSggName(r.sggName)}`;
      const hit = resolver.get(rkey);
      if (!hit) {
        unresolved += 1;
        if (warnings.length < 40)
          warnings.push(`미해결 sggId: ${r.sido} ${r.officeKind} "${r.sggName}" (${f})`);
        continue;
      }
      const key = `${r.sido}|${hit.guName}|${normalizeDong(r.hdong)}`;
      const entry = ensure(key);
      if (r.officeKind === 'metropolitan_member') {
        entry.metropolitanSggId = hit.sggId;
        entry.metropolitanSggName = roster.sggIndex[hit.sggId]?.sggName;
        entry.metropolitanCandidateCount = hit.candidateCount;
      } else {
        entry.basicSggId = hit.sggId;
        entry.basicSggName = roster.sggIndex[hit.sggId]?.sggName;
        entry.basicCandidateCount = hit.candidateCount;
      }
      if (r.sourceUrl && !entry.sourceUrls!.includes(r.sourceUrl)) entry.sourceUrls!.push(r.sourceUrl);
      coverageSet.add(`${r.sido} ${hit.guName}`);
    }
  }

  // byBcode 보강: 법정동코드 → (sido, sigungu, hname) → byName 정규화 키
  const byBcode: Record<string, AssemblyEntry> = {};
  for (const [bcode, m] of Object.entries(bcodeMap.byBcode)) {
    const key = `${m.sido}|${m.sigungu}|${normalizeDong(m.hname)}`;
    const entry = byName[key];
    if (entry) byBcode[bcode] = entry;
  }

  const coverage = Array.from(coverageSet).sort();
  const output = {
    version: 2,
    generatedAt: new Date().toISOString(),
    notes: [
      '행정동 → 광역의원/기초의원 선거구 매핑 (법령 별표 기반).',
      '광역의원: 공직선거법 별표2 (parse_byeolpyo2.py). 기초의원: 시·도 조례 별표.',
      'byName 키: "시·도명|시·군·구명|정규화행정동명" (normalize.ts).',
      '제주특별자치도 광역의원은 제주특별법 소관으로 별표2 미포함 → 시·군·구 fallback.',
    ],
    coverage,
    coverageCount: coverage.length,
    stats: { csvRows: rowCount, unresolved, byNameKeys: Object.keys(byName).length },
    byBcode,
    byName,
    byBcodeCount: Object.keys(byBcode).length,
    byNameCount: Object.keys(byName).length,
  };

  for (const w of warnings) console.warn('  ⚠', w);
  if (unresolved > 0) console.warn(`  ⚠ 총 미해결 행: ${unresolved}/${rowCount}`);

  const serialized = JSON.stringify(output, null, 2);
  if (dryRun) {
    console.log(
      `[dry-run] byName=${output.byNameCount} byBcode=${output.byBcodeCount} coverage=${coverage.length} 시군구`
    );
    return;
  }
  writeFileSync(OUT_PATH, serialized, 'utf-8');
  console.log(`✓ Wrote ${OUT_PATH} (${serialized.length} bytes)`);
  console.log(`  byName: ${output.byNameCount} / byBcode: ${output.byBcodeCount}`);
  console.log(`  coverage: ${coverage.length} 시·군·구 / csvRows ${rowCount} / unresolved ${unresolved}`);
}

main();
