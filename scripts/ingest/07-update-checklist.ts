/**
 * #14 §1 — 후보자 명부 체크리스트 자동 갱신.
 *
 * `data/curated/` 내 수집 산출물 존재 여부를 스캔해서 roster-2026.json의
 * `collected.{필드}` 플래그를 true/false로 동기화.
 *
 * 매칭 규칙 (개인 후보 한정):
 *   {huboId}_detail.json   → necDetail + (photoUrl 존재 시) necPhoto
 *   {huboId}_promise.json  → necPromise
 *   {huboId}_wiki.json     → wikidata
 *   {huboId}_smc.json      → smcCouncil
 *   {huboId}_peti.json     → petiBreakdown
 *
 * 사용:
 *   pnpm tsx scripts/ingest/07-update-checklist.ts
 *   pnpm tsx scripts/ingest/07-update-checklist.ts --dry-run
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ChecklistEntry, CollectionChecklist } from './01b-fetch-national-roster.js';
import { OFFICE_PROFILES, type OfficeKind } from '../../types/domain.js';

/**
 * 직책별 적용 여부.
 * 5대공약 의무가 없는 직책은 `necPromise` 통계에서 분모에서 제외.
 */
function isFlagApplicable(flag: keyof CollectionChecklist, kind: OfficeKind): boolean {
  const profile = OFFICE_PROFILES[kind];
  if (flag === 'necPromise') return profile.requiresFiveCommitments;
  // smcCouncil은 서울 시의원 출신만 — 통계는 일단 전체 모수 유지 (수집 가능자에 따라 0건일 수 있음)
  return true;
}

const ROSTER_PATH = resolve(process.cwd(), 'data/curated/roster-2026.json');
const CURATED_DIR = resolve(process.cwd(), 'data/curated');

type FileSuffix = '_detail.json' | '_promise.json' | '_wiki.json' | '_smc.json' | '_peti.json';

const SIGNALS: Array<{ flag: keyof CollectionChecklist; suffix: FileSuffix }> = [
  { flag: 'necDetail', suffix: '_detail.json' },
  { flag: 'necPromise', suffix: '_promise.json' },
  { flag: 'wikidata', suffix: '_wiki.json' },
  { flag: 'smcCouncil', suffix: '_smc.json' },
  { flag: 'petiBreakdown', suffix: '_peti.json' },
];

interface Roster {
  generatedAt: string;
  sgId: string;
  elapsedSec: string;
  summary: Record<string, unknown>;
  errors: Array<{ stage: string; ctx: string; msg: string }>;
  candidates: ChecklistEntry[];
  checklistStats?: ChecklistStats;
}

interface ChecklistStats {
  asOf: string;
  totalIndividuals: number;
  totalParty: number;
  /** 수집된 수치 (분자). */
  completion: Record<keyof CollectionChecklist, number>;
  /** 직책 적용 가능 후보 수치 (분모) — 5대공약 의무 X 직책 등은 제외. */
  applicable: Record<keyof CollectionChecklist, number>;
  completionPct: Record<keyof CollectionChecklist, string>;
}

function loadRoster(): Roster {
  if (!existsSync(ROSTER_PATH)) {
    throw new Error(`roster 파일 없음: ${ROSTER_PATH}`);
  }
  return JSON.parse(readFileSync(ROSTER_PATH, 'utf-8'));
}

function buildStats(candidates: ChecklistEntry[]): ChecklistStats {
  const individuals = candidates.filter((c) => c.kind === 'individual');
  const party = candidates.filter((c) => c.kind === 'party_proportional');
  const flags: Array<keyof CollectionChecklist> = [
    'necDetail',
    'necPromise',
    'necPhoto',
    'wikidata',
    'smcCouncil',
    'petiBreakdown',
  ];
  const completion = {} as Record<keyof CollectionChecklist, number>;
  const applicable = {} as Record<keyof CollectionChecklist, number>;
  const completionPct = {} as Record<keyof CollectionChecklist, string>;
  for (const f of flags) {
    // 직책별 적용 여부 — 5대공약 의무 X 직책은 necPromise 모수에서 제외
    const applicableCands = individuals.filter((c) => isFlagApplicable(f, c.officeKind));
    const n = applicableCands.filter((c) => c.collected[f]).length;
    completion[f] = n;
    applicable[f] = applicableCands.length;
    completionPct[f] = applicableCands.length > 0
      ? ((n / applicableCands.length) * 100).toFixed(1) + '%'
      : '—';
  }
  return {
    asOf: new Date().toISOString(),
    totalIndividuals: individuals.length,
    totalParty: party.length,
    completion,
    applicable,
    completionPct,
  };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const roster = loadRoster();
  const files = new Set(readdirSync(CURATED_DIR));

  let updated = 0;

  for (const entry of roster.candidates) {
    if (entry.kind !== 'individual') continue;

    let changed = false;

    for (const sig of SIGNALS) {
      const fileName = `${entry.huboId}${sig.suffix}`;
      const present = files.has(fileName);
      if (present !== entry.collected[sig.flag]) {
        entry.collected[sig.flag] = present;
        changed = true;
      }
    }

    // photoUrl은 detail JSON 내부 필드 — 별도 확인
    if (entry.collected.necDetail) {
      try {
        const detailPath = resolve(CURATED_DIR, `${entry.huboId}_detail.json`);
        const detail = JSON.parse(readFileSync(detailPath, 'utf-8')) as { photoUrl?: string };
        const hasPhoto = !!(detail.photoUrl && detail.photoUrl.length > 0);
        if (hasPhoto !== entry.collected.necPhoto) {
          entry.collected.necPhoto = hasPhoto;
          changed = true;
        }
      } catch {
        // detail JSON 파싱 실패 시 photo 플래그 변경 없음
      }
    } else if (entry.collected.necPhoto) {
      entry.collected.necPhoto = false;
      changed = true;
    }

    if (changed) updated++;
  }

  const stats = buildStats(roster.candidates);
  roster.checklistStats = stats;

  if (!dryRun) {
    writeFileSync(ROSTER_PATH, JSON.stringify(roster, null, 2));
    console.error(`✅ 저장: ${ROSTER_PATH}`);
  } else {
    console.error(`(dry-run) 저장 생략`);
  }

  console.error(`갱신 후보 ${updated}명 / 개인 후보 ${stats.totalIndividuals}명 / 정당명부 ${stats.totalParty}건`);
  console.error('수집 진행률 (분자/분모):');
  for (const flag of Object.keys(stats.completion) as Array<keyof CollectionChecklist>) {
    const num = String(stats.completion[flag]).padStart(5);
    const den = String(stats.applicable[flag]).padStart(5);
    console.error(`  ${flag.padEnd(15)} ${num} / ${den} (${stats.completionPct[flag]})`);
  }
}

if (process.argv[1]?.endsWith('07-update-checklist.ts')) {
  main();
}
