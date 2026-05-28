/**
 * #15 §3.4-B2 — 전국 일괄 03-promise 실행.
 *
 * 입력: roster-2026.json
 * 출력: {huboId}_promise.json (5대공약 의무 직책의 ocrCnvrSeqNo 있는 entry만)
 *
 * 직책 분기: `OFFICE_PROFILES[*].requiresFiveCommitments=false`는 자동 skip.
 *   - basic_member, basic_proportional (NEC 5대공약 비대상)
 *
 * 사용:
 *   pnpm tsx scripts/ingest/run-batch-promise.ts                # 전체 (skip existing)
 *   pnpm tsx scripts/ingest/run-batch-promise.ts --force --rate=500
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchPromises } from './03-fetch-promise-text.js';
import type { ChecklistEntry } from './01b-fetch-national-roster.js';
import { OFFICE_PROFILES } from '../../types/domain.js';

const ROSTER_PATH = resolve(process.cwd(), 'data/curated/roster-2026.json');
const CURATED_DIR = resolve(process.cwd(), 'data/curated');
const ERRORS_PATH = resolve(CURATED_DIR, 'batch-promise-errors.json');

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
  ocrCnvrSeqNo: string;
  message: string;
  at: string;
}

function parseCli(): CliOpts {
  const o: CliOpts = { force: false, rateMs: 300, quiet: false };
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

  let targets = candidates.filter((c) => {
    if (c.kind !== 'individual' || !c.huboId) return false;
    if (!c.ocrCnvrSeqNo) return false; // 5대공약 없음
    // 직책별 의무 여부 — 비대상은 skip
    const profile = OFFICE_PROFILES[c.officeKind];
    if (!profile || !profile.requiresFiveCommitments) return false;
    return true;
  });

  if (opts.sgType) targets = targets.filter((c) => c.sgTypecode === opts.sgType);
  if (opts.sido) targets = targets.filter((c) => c.sidoCode === opts.sido);
  if (opts.limit) targets = targets.slice(0, opts.limit);

  mkdirSync(CURATED_DIR, { recursive: true });
  const errors: BatchError[] = [];
  const start = Date.now();
  let saved = 0;
  let skipped = 0;
  let failed = 0;

  console.error(
    `▶ batch-promise 시작 — 대상 ${targets.length}명 (rate ${opts.rateMs}ms / force=${opts.force})`
  );

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (!t || !t.ocrCnvrSeqNo) continue;
    const outPath = resolve(CURATED_DIR, `${t.huboId}_promise.json`);

    if (!opts.force && existsSync(outPath)) {
      skipped++;
      continue;
    }

    try {
      const promises = await fetchPromises(t.ocrCnvrSeqNo);
      writeFileSync(
        outPath,
        JSON.stringify(
          { huboId: t.huboId, ocrCnvrSeqNo: t.ocrCnvrSeqNo, promises },
          null,
          2
        )
      );
      saved++;
    } catch (e) {
      failed++;
      errors.push({
        huboId: t.huboId,
        name: t.name,
        ocrCnvrSeqNo: t.ocrCnvrSeqNo,
        message: e instanceof Error ? e.message : String(e),
        at: new Date().toISOString(),
      });
    }

    if (!opts.quiet && (i + 1) % 100 === 0) {
      const pct = (((i + 1) / targets.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      console.error(
        `  ${i + 1}/${targets.length} (${pct}%) — saved=${saved} skip=${skipped} fail=${failed} / ${elapsed}s`
      );
    }

    await sleep(opts.rateMs);
  }

  writeFileSync(ERRORS_PATH, JSON.stringify({ asOf: new Date().toISOString(), errors }, null, 2));

  const elapsedMin = ((Date.now() - start) / 60_000).toFixed(1);
  console.error(`\n✅ batch-promise 종료 (${elapsedMin}분)`);
  console.error(`   saved=${saved} skipped=${skipped} failed=${failed}`);
  if (failed > 0) console.error(`   에러 상세: ${ERRORS_PATH}`);
}

if (process.argv[1]?.endsWith('run-batch-promise.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
