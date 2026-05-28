/**
 * #15 §3.4-B3 — 전국 일괄 06-wikidata 실행.
 *
 * 의존: 02-detail 산출물 (`{huboId}_detail.json`)에서 name + birthDate 추출.
 * 가드레일: NEC 출생일과 Wikidata P569 정확 일치 시만 통과.
 *
 * 사용:
 *   pnpm tsx scripts/ingest/run-batch-wikidata.ts                 # 전체 (skip existing)
 *   pnpm tsx scripts/ingest/run-batch-wikidata.ts --rate=800      # 외부 API rate 보호
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchWikidata } from './06-fetch-wikidata.js';
import type { ChecklistEntry } from './01b-fetch-national-roster.js';

const ROSTER_PATH = resolve(process.cwd(), 'data/curated/roster-2026.json');
const CURATED_DIR = resolve(process.cwd(), 'data/curated');
const ERRORS_PATH = resolve(CURATED_DIR, 'batch-wikidata-errors.json');

interface CliOpts {
  force: boolean;
  rateMs: number;
  sgType?: string;
  sido?: string;
  limit?: number;
  quiet: boolean;
}

interface BatchError {
  huboId: string;
  name: string;
  birthDate: string;
  message: string;
  at: string;
}

function parseCli(): CliOpts {
  const o: CliOpts = { force: false, rateMs: 800, quiet: false };
  for (const a of process.argv.slice(2)) {
    if (a === '--force') o.force = true;
    else if (a === '--quiet') o.quiet = true;
    else {
      const m = a.match(/^--(\w+)=(.+)$/);
      if (!m || !m[1] || !m[2]) continue;
      if (m[1] === 'rate') o.rateMs = Number(m[2]);
      else if (m[1] === 'sgType') o.sgType = m[2];
      else if (m[1] === 'sido') o.sido = m[2];
      else if (m[1] === 'limit') o.limit = Number(m[2]);
    }
  }
  return o;
}

function loadRoster(): { candidates: ChecklistEntry[] } {
  if (!existsSync(ROSTER_PATH)) {
    throw new Error(`roster 파일 없음 — 먼저 01b-fetch-national-roster.ts 실행 필요`);
  }
  return JSON.parse(readFileSync(ROSTER_PATH, 'utf-8'));
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function main() {
  const opts = parseCli();
  const { candidates } = loadRoster();

  let targets = candidates.filter((c) => c.kind === 'individual' && c.huboId);
  if (opts.sgType) targets = targets.filter((c) => c.sgTypecode === opts.sgType);
  if (opts.sido) targets = targets.filter((c) => c.sidoCode === opts.sido);
  if (opts.limit) targets = targets.slice(0, opts.limit);

  mkdirSync(CURATED_DIR, { recursive: true });
  const errors: BatchError[] = [];
  const start = Date.now();
  let saved = 0;
  let skippedExisting = 0;
  let skippedNoDetail = 0;
  let failed = 0;
  let noMatch = 0;

  console.error(
    `▶ batch-wikidata 시작 — 대상 ${targets.length}명 (rate ${opts.rateMs}ms / force=${opts.force})`
  );

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (!t) continue;
    const outPath = resolve(CURATED_DIR, `${t.huboId}_wiki.json`);
    const detailPath = resolve(CURATED_DIR, `${t.huboId}_detail.json`);

    if (!opts.force && existsSync(outPath)) {
      skippedExisting++;
      continue;
    }
    if (!existsSync(detailPath)) {
      skippedNoDetail++;
      continue;
    }

    try {
      const detail = JSON.parse(readFileSync(detailPath, 'utf-8')) as {
        name?: string;
        birthDate?: string;
      };
      if (!detail.name || !detail.birthDate) {
        throw new Error(`detail에 name 또는 birthDate 없음`);
      }

      const result = await fetchWikidata(detail.name, detail.birthDate);
      // 가드레일 미통과(=null)는 빈 객체로 저장 → 재시도 방지 + 명시적 기록
      writeFileSync(
        outPath,
        JSON.stringify(
          result ?? { matched: false, name: detail.name, birthDate: detail.birthDate },
          null,
          2
        )
      );
      if (result) saved++;
      else noMatch++;
    } catch (e) {
      failed++;
      errors.push({
        huboId: t.huboId,
        name: t.name,
        birthDate: '?',
        message: e instanceof Error ? e.message : String(e),
        at: new Date().toISOString(),
      });
    }

    if (!opts.quiet && (i + 1) % 100 === 0) {
      const pct = (((i + 1) / targets.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.error(
        `  ${i + 1}/${targets.length} (${pct}%) — saved=${saved} noMatch=${noMatch} skip_existing=${skippedExisting} skip_nodetail=${skippedNoDetail} fail=${failed} / ${elapsed}s`
      );
    }

    await sleep(opts.rateMs);
  }

  writeFileSync(ERRORS_PATH, JSON.stringify({ asOf: new Date().toISOString(), errors }, null, 2));

  const elapsedMin = ((Date.now() - start) / 60_000).toFixed(1);
  console.error(`\n✅ batch-wikidata 종료 (${elapsedMin}분)`);
  console.error(
    `   matched=${saved} noMatch=${noMatch} skip_existing=${skippedExisting} skip_nodetail=${skippedNoDetail} failed=${failed}`
  );
  if (failed > 0) console.error(`   에러 상세: ${ERRORS_PATH}`);
}

if (process.argv[1]?.endsWith('run-batch-wikidata.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
