/**
 * #15 §3.4-B1 — 전국 일괄 02-detail 실행.
 *
 * 입력: data/curated/roster-2026.json
 * 출력: data/curated/{huboId}_detail.json (N개 — 개인 후보 한정)
 *
 * 특징:
 *  - **idempotent**: 기존 파일 있으면 skip (`--force` 로 재실행 강제)
 *  - **rate limit**: 기본 250ms (`--rate=500` 으로 조절)
 *  - **graceful**: 한 후보 실패해도 다음 진행. 에러는 batch-errors.json에 누적
 *  - **progress**: 100명마다 진행률 로그 (`--quiet` 으로 무음)
 *  - **filter**: `--sgType=4` / `--sido=1100` 으로 부분 실행
 *
 * 사용:
 *   pnpm tsx scripts/ingest/run-batch-detail.ts                 # 전체 (skip existing)
 *   pnpm tsx scripts/ingest/run-batch-detail.ts --force          # 전체 재실행
 *   pnpm tsx scripts/ingest/run-batch-detail.ts --sgType=4       # 기초장만
 *   pnpm tsx scripts/ingest/run-batch-detail.ts --sido=1100 --sgType=6   # 서울 기초의원만
 *   pnpm tsx scripts/ingest/run-batch-detail.ts --limit=10       # 처음 10명 (테스트)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseDetail } from './02-parse-detail-html.js';
import type { ChecklistEntry } from './01b-fetch-national-roster.js';

const ROSTER_PATH = resolve(process.cwd(), 'data/curated/roster-2026.json');
const CURATED_DIR = resolve(process.cwd(), 'data/curated');
const ERRORS_PATH = resolve(CURATED_DIR, 'batch-detail-errors.json');

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
  sgTypeName: string;
  sidoName: string;
  message: string;
  at: string;
}

function parseCli(): CliOpts {
  const o: CliOpts = { force: false, rateMs: 250, quiet: false };
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

  // 개인 후보만 + CLI 필터 적용
  let targets = candidates.filter((c) => c.kind === 'individual' && c.huboId);
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
    `▶ batch-detail 시작 — 대상 ${targets.length}명 (rate ${opts.rateMs}ms / force=${opts.force})`
  );

  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    if (!t) continue;
    const outPath = resolve(CURATED_DIR, `${t.huboId}_detail.json`);

    if (!opts.force && existsSync(outPath)) {
      skipped++;
      continue;
    }

    try {
      const detail = await parseDetail(t.huboId);
      // 최소 필수 필드 검증 — name·birthDate 없으면 저장 거부 (W5 보강)
      if (!detail.name || !detail.birthDate) {
        throw new Error(
          `필수 필드 누락: name=${!!detail.name} birthDate=${!!detail.birthDate}`
        );
      }
      writeFileSync(outPath, JSON.stringify(detail, null, 2));
      saved++;
    } catch (e) {
      failed++;
      errors.push({
        huboId: t.huboId,
        name: t.name,
        sgTypeName: t.sgTypeName,
        sidoName: t.sidoName,
        message: e instanceof Error ? e.message : String(e),
        at: new Date().toISOString(),
      });
    }

    // 진행률 로그
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
  console.error(`\n✅ batch-detail 종료 (${elapsedMin}분)`);
  console.error(`   saved=${saved} skipped=${skipped} failed=${failed}`);
  if (failed > 0) console.error(`   에러 상세: ${ERRORS_PATH}`);
}

if (process.argv[1]?.endsWith('run-batch-detail.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
