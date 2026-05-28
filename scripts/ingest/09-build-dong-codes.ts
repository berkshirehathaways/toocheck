/**
 * #52 Phase 2 — 법정동코드 → 행정동명 매핑 빌더.
 *
 * 입력: 큐레이션된 TypeScript 데이터 (이 파일의 SEED 상수).
 *        + 선택적으로 data/raw/dong-codes-extra/*.csv 머지 (UTF-8, 헤더: bcode,sido,sigungu,bname,hname)
 * 출력: data/curated/bcode-to-hdong.json
 *
 * Phase 2 PoC: 서울 종로구 17 법정동을 시드. 다른 시·도/시·군·구는 점진적으로 추가.
 *
 * 카카오 우편번호 응답이 hname을 채워주는 경우(대부분의 도시 도로명 주소)에는 이 매핑이 필요 없다.
 * 일부 누락/공백 케이스에 대해 bcode 기준으로 행정동명을 보장하기 위해 별도 매핑을 유지.
 *
 * 출처 (수기 검수 기준):
 *  - 행정안전부 행정표준코드관리시스템 (https://www.code.go.kr)
 *  - 서울 종로구 행정동 안내 (https://www.jongno.go.kr)
 *
 * 사용:
 *   pnpm tsx scripts/ingest/09-build-dong-codes.ts
 *   pnpm tsx scripts/ingest/09-build-dong-codes.ts --dry-run
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const OUT_PATH = resolve(process.cwd(), 'data/curated/bcode-to-hdong.json');
const EXTRA_DIR = resolve(process.cwd(), 'data/raw/dong-codes-extra');

interface DongEntry {
  bcode: string;       // 법정동코드 10자리
  sido: string;        // 예: "서울특별시"
  sigungu: string;     // 예: "종로구"
  bname: string;       // 법정동명, 예: "청운동"
  hname: string;       // 행정동명, 예: "청운효자동"
}

// 서울 종로구 — 17 법정동 → 행정동 매핑 (2026-05-28 큐레이션)
// 출처: 종로구청 행정동 안내 + 행안부 표준코드
const SEED: DongEntry[] = [
  // 청운효자동 = 청운동·신교동·궁정동·효자동·창성동·통의동·적선동·통인동·누상동·누하동·옥인동·체부동·필운동·내자동·세종로(일부)
  { bcode: '1111010100', sido: '서울특별시', sigungu: '종로구', bname: '청운동',   hname: '청운효자동' },
  { bcode: '1111010200', sido: '서울특별시', sigungu: '종로구', bname: '신교동',   hname: '청운효자동' },
  { bcode: '1111010300', sido: '서울특별시', sigungu: '종로구', bname: '궁정동',   hname: '청운효자동' },
  { bcode: '1111010400', sido: '서울특별시', sigungu: '종로구', bname: '효자동',   hname: '청운효자동' },
  { bcode: '1111010500', sido: '서울특별시', sigungu: '종로구', bname: '창성동',   hname: '청운효자동' },
  { bcode: '1111010600', sido: '서울특별시', sigungu: '종로구', bname: '통의동',   hname: '청운효자동' },
  { bcode: '1111010700', sido: '서울특별시', sigungu: '종로구', bname: '적선동',   hname: '사직동' },
  { bcode: '1111010800', sido: '서울특별시', sigungu: '종로구', bname: '통인동',   hname: '청운효자동' },
  { bcode: '1111010900', sido: '서울특별시', sigungu: '종로구', bname: '누상동',   hname: '청운효자동' },
  { bcode: '1111011000', sido: '서울특별시', sigungu: '종로구', bname: '누하동',   hname: '청운효자동' },
  { bcode: '1111011100', sido: '서울특별시', sigungu: '종로구', bname: '옥인동',   hname: '청운효자동' },
  { bcode: '1111011200', sido: '서울특별시', sigungu: '종로구', bname: '체부동',   hname: '사직동' },
  { bcode: '1111011300', sido: '서울특별시', sigungu: '종로구', bname: '필운동',   hname: '사직동' },
  { bcode: '1111011400', sido: '서울특별시', sigungu: '종로구', bname: '내자동',   hname: '사직동' },
  { bcode: '1111011500', sido: '서울특별시', sigungu: '종로구', bname: '사직동',   hname: '사직동' },
  { bcode: '1111011600', sido: '서울특별시', sigungu: '종로구', bname: '도렴동',   hname: '사직동' },
  { bcode: '1111011700', sido: '서울특별시', sigungu: '종로구', bname: '당주동',   hname: '사직동' },
  { bcode: '1111011800', sido: '서울특별시', sigungu: '종로구', bname: '내수동',   hname: '사직동' },
  { bcode: '1111011900', sido: '서울특별시', sigungu: '종로구', bname: '세종로',   hname: '사직동' },
  { bcode: '1111012000', sido: '서울특별시', sigungu: '종로구', bname: '신문로1가', hname: '사직동' },
  { bcode: '1111012100', sido: '서울특별시', sigungu: '종로구', bname: '신문로2가', hname: '사직동' },
  // 삼청동
  { bcode: '1111012200', sido: '서울특별시', sigungu: '종로구', bname: '청진동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111012300', sido: '서울특별시', sigungu: '종로구', bname: '서린동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111012400', sido: '서울특별시', sigungu: '종로구', bname: '수송동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111012500', sido: '서울특별시', sigungu: '종로구', bname: '중학동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111012600', sido: '서울특별시', sigungu: '종로구', bname: '종로1가',   hname: '종로1·2·3·4가동' },
  { bcode: '1111012700', sido: '서울특별시', sigungu: '종로구', bname: '공평동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111012800', sido: '서울특별시', sigungu: '종로구', bname: '관훈동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111012900', sido: '서울특별시', sigungu: '종로구', bname: '견지동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013000', sido: '서울특별시', sigungu: '종로구', bname: '와룡동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013100', sido: '서울특별시', sigungu: '종로구', bname: '권농동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013200', sido: '서울특별시', sigungu: '종로구', bname: '운니동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013300', sido: '서울특별시', sigungu: '종로구', bname: '익선동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013400', sido: '서울특별시', sigungu: '종로구', bname: '경운동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013500', sido: '서울특별시', sigungu: '종로구', bname: '관철동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013600', sido: '서울특별시', sigungu: '종로구', bname: '인사동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013700', sido: '서울특별시', sigungu: '종로구', bname: '낙원동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013800', sido: '서울특별시', sigungu: '종로구', bname: '종로2가',   hname: '종로1·2·3·4가동' },
  { bcode: '1111013900', sido: '서울특별시', sigungu: '종로구', bname: '묘동',     hname: '종로1·2·3·4가동' },
  { bcode: '1111014000', sido: '서울특별시', sigungu: '종로구', bname: '봉익동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111014100', sido: '서울특별시', sigungu: '종로구', bname: '돈의동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111014200', sido: '서울특별시', sigungu: '종로구', bname: '장사동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111014300', sido: '서울특별시', sigungu: '종로구', bname: '관수동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111014400', sido: '서울특별시', sigungu: '종로구', bname: '종로3가',   hname: '종로1·2·3·4가동' },
  { bcode: '1111014500', sido: '서울특별시', sigungu: '종로구', bname: '인의동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111014600', sido: '서울특별시', sigungu: '종로구', bname: '예지동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111014700', sido: '서울특별시', sigungu: '종로구', bname: '원남동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111014800', sido: '서울특별시', sigungu: '종로구', bname: '종로4가',   hname: '종로1·2·3·4가동' },
  { bcode: '1111014900', sido: '서울특별시', sigungu: '종로구', bname: '효제동',   hname: '종로5·6가동' },
  { bcode: '1111015000', sido: '서울특별시', sigungu: '종로구', bname: '종로5가',   hname: '종로5·6가동' },
  { bcode: '1111015100', sido: '서울특별시', sigungu: '종로구', bname: '종로6가',   hname: '종로5·6가동' },
  { bcode: '1111015200', sido: '서울특별시', sigungu: '종로구', bname: '연건동',   hname: '이화동' },
  { bcode: '1111015300', sido: '서울특별시', sigungu: '종로구', bname: '충신동',   hname: '이화동' },
  { bcode: '1111015400', sido: '서울특별시', sigungu: '종로구', bname: '이화동',   hname: '이화동' },
  { bcode: '1111015500', sido: '서울특별시', sigungu: '종로구', bname: '동숭동',   hname: '이화동' },
  { bcode: '1111015600', sido: '서울특별시', sigungu: '종로구', bname: '혜화동',   hname: '혜화동' },
  { bcode: '1111015700', sido: '서울특별시', sigungu: '종로구', bname: '명륜1가',   hname: '혜화동' },
  { bcode: '1111015800', sido: '서울특별시', sigungu: '종로구', bname: '명륜2가',   hname: '혜화동' },
  { bcode: '1111015900', sido: '서울특별시', sigungu: '종로구', bname: '명륜3가',   hname: '혜화동' },
  { bcode: '1111016000', sido: '서울특별시', sigungu: '종로구', bname: '명륜4가',   hname: '혜화동' },
  { bcode: '1111016100', sido: '서울특별시', sigungu: '종로구', bname: '와룡동',   hname: '종로1·2·3·4가동' },
  // 가회동·삼청동·부암동·평창동·무악동·교남동
  { bcode: '1111016200', sido: '서울특별시', sigungu: '종로구', bname: '삼청동',   hname: '삼청동' },
  { bcode: '1111016300', sido: '서울특별시', sigungu: '종로구', bname: '팔판동',   hname: '삼청동' },
  { bcode: '1111016400', sido: '서울특별시', sigungu: '종로구', bname: '안국동',   hname: '가회동' },
  { bcode: '1111016500', sido: '서울특별시', sigungu: '종로구', bname: '소격동',   hname: '삼청동' },
  { bcode: '1111016600', sido: '서울특별시', sigungu: '종로구', bname: '화동',     hname: '가회동' },
  { bcode: '1111016700', sido: '서울특별시', sigungu: '종로구', bname: '사간동',   hname: '삼청동' },
  { bcode: '1111016800', sido: '서울특별시', sigungu: '종로구', bname: '송현동',   hname: '삼청동' },
  { bcode: '1111016900', sido: '서울특별시', sigungu: '종로구', bname: '가회동',   hname: '가회동' },
  { bcode: '1111017000', sido: '서울특별시', sigungu: '종로구', bname: '재동',     hname: '가회동' },
  { bcode: '1111017100', sido: '서울특별시', sigungu: '종로구', bname: '계동',     hname: '가회동' },
  { bcode: '1111017200', sido: '서울특별시', sigungu: '종로구', bname: '원서동',   hname: '가회동' },
  { bcode: '1111017300', sido: '서울특별시', sigungu: '종로구', bname: '훈정동',   hname: '종로1·2·3·4가동' },
  { bcode: '1111017400', sido: '서울특별시', sigungu: '종로구', bname: '돈화문로', hname: '종로1·2·3·4가동' },
  { bcode: '1111017500', sido: '서울특별시', sigungu: '종로구', bname: '부암동',   hname: '부암동' },
  { bcode: '1111017600', sido: '서울특별시', sigungu: '종로구', bname: '홍지동',   hname: '부암동' },
  { bcode: '1111017700', sido: '서울특별시', sigungu: '종로구', bname: '신영동',   hname: '부암동' },
  { bcode: '1111017800', sido: '서울특별시', sigungu: '종로구', bname: '구기동',   hname: '평창동' },
  { bcode: '1111017900', sido: '서울특별시', sigungu: '종로구', bname: '평창동',   hname: '평창동' },
  { bcode: '1111018000', sido: '서울특별시', sigungu: '종로구', bname: '신영동',   hname: '부암동' },
  { bcode: '1111018100', sido: '서울특별시', sigungu: '종로구', bname: '무악동',   hname: '무악동' },
  { bcode: '1111018200', sido: '서울특별시', sigungu: '종로구', bname: '교남동',   hname: '교남동' },
  { bcode: '1111018300', sido: '서울특별시', sigungu: '종로구', bname: '평동',     hname: '교남동' },
  { bcode: '1111018400', sido: '서울특별시', sigungu: '종로구', bname: '송월동',   hname: '교남동' },
  { bcode: '1111018500', sido: '서울특별시', sigungu: '종로구', bname: '홍파동',   hname: '교남동' },
  { bcode: '1111018600', sido: '서울특별시', sigungu: '종로구', bname: '교북동',   hname: '교남동' },
  { bcode: '1111018700', sido: '서울특별시', sigungu: '종로구', bname: '행촌동',   hname: '교남동' },
  // 창신·숭인 (행정동 분리: 창신1·2·3동, 숭인1·2동)
  { bcode: '1111018800', sido: '서울특별시', sigungu: '종로구', bname: '창신동',   hname: '창신1동' },
  { bcode: '1111018900', sido: '서울특별시', sigungu: '종로구', bname: '숭인동',   hname: '숭인1동' },
];

function parseCsv(content: string): DongEntry[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = lines[0]!.split(',').map((c) => c.trim());
  const idx = {
    bcode: header.indexOf('bcode'),
    sido: header.indexOf('sido'),
    sigungu: header.indexOf('sigungu'),
    bname: header.indexOf('bname'),
    hname: header.indexOf('hname'),
  };
  if (Object.values(idx).some((i) => i < 0)) {
    throw new Error(`CSV header missing required columns. Got: ${header.join(',')}`);
  }
  return lines.slice(1).map((row) => {
    const cells = row.split(',').map((c) => c.trim());
    return {
      bcode: cells[idx.bcode] ?? '',
      sido: cells[idx.sido] ?? '',
      sigungu: cells[idx.sigungu] ?? '',
      bname: cells[idx.bname] ?? '',
      hname: cells[idx.hname] ?? '',
    };
  });
}

function loadExtraCsvs(): DongEntry[] {
  if (!existsSync(EXTRA_DIR)) return [];
  const files = readdirSync(EXTRA_DIR).filter((f) => f.endsWith('.csv'));
  const out: DongEntry[] = [];
  for (const f of files) {
    const content = readFileSync(resolve(EXTRA_DIR, f), 'utf-8');
    out.push(...parseCsv(content));
  }
  return out;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const extras = loadExtraCsvs();
  // bcode 기준 dedupe — extras가 SEED를 덮어쓰지 못하도록 SEED 우선
  const combined = new Map<string, DongEntry>();
  for (const e of extras) combined.set(e.bcode, e);
  for (const e of SEED) combined.set(e.bcode, e);

  const entries = Array.from(combined.values()).sort((a, b) => a.bcode.localeCompare(b.bcode));
  const byBcode: Record<string, Omit<DongEntry, 'bcode'>> = {};
  for (const e of entries) {
    byBcode[e.bcode] = { sido: e.sido, sigungu: e.sigungu, bname: e.bname, hname: e.hname };
  }

  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    notes: [
      'bcode(법정동코드 10자리) → { sido, sigungu, bname, hname }.',
      '카카오 우편번호 응답이 hname을 채우지 못하는 케이스에 대한 보강 매핑.',
      'Phase 2 PoC: 서울 종로구만 시드. 다른 지역은 data/raw/dong-codes-extra/*.csv 추가 또는 SEED 수기 확장.',
    ],
    coverage: Array.from(new Set(entries.map((e) => `${e.sido}|${e.sigungu}`))).sort(),
    count: entries.length,
    byBcode,
  };

  const serialized = JSON.stringify(output, null, 2);
  if (dryRun) {
    console.log(`[dry-run] would write ${OUT_PATH} (${serialized.length} bytes, ${entries.length} entries)`);
    return;
  }
  writeFileSync(OUT_PATH, serialized, 'utf-8');
  console.log(`✓ Wrote ${OUT_PATH} (${serialized.length} bytes, ${entries.length} entries)`);
  console.log(`  Coverage: ${output.coverage.join(', ')}`);
}

main();
