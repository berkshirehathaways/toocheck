/**
 * #14 §1-2 확장 — 전국 후보자 등록 명부 + 수집 체크리스트.
 *
 * 2026 지방선거(sgId=20260603) 7개 선거 × 17 시·도 × N 구·시·군 전체 인덱싱.
 *
 * 출력: data/curated/roster-2026.json
 *   {
 *     generatedAt, sgId, elapsedSec,
 *     summary: { totalCount, byType, bySido },
 *     errors: [...],
 *     candidates: ChecklistEntry[]   // 각 후보별 수집 상태 boolean 6종
 *   }
 *
 * 사용:
 *   pnpm tsx scripts/ingest/01b-fetch-national-roster.ts                 # 전국
 *   pnpm tsx scripts/ingest/01b-fetch-national-roster.ts --sido=1100    # 서울만
 *   pnpm tsx scripts/ingest/01b-fetch-national-roster.ts --sgType=3     # 시·도지사만
 *   pnpm tsx scripts/ingest/01b-fetch-national-roster.ts --sido=1100 --sgType=4
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchText, fetchJson, extractJsessionId } from './_common.js';
import { SGTYPECODE_TO_OFFICE_KIND, type OfficeKind } from '../../types/domain.js';

const BASE = 'https://policy.nec.go.kr';
const SG_ID = '20260603';

/**
 * policy.nec.go.kr sgTypecode 매핑 (2026-05-28 실측 확정).
 *
 * `kind`:
 *  - 'individual': huboid 단위 후보 (necDetail/necPromise 파이프라인 호환)
 *  - 'party_proportional': 정당명부 비례 (jdid 단위) — 후보 detail은 정당 공보 PDF 안에 있음
 *
 * 비포함:
 *  - sgType 7 (기초의원 지역구) — policy.nec 미인덱싱 (~7,000명, Phase 2 별도 처리)
 *  - sgType 1·2 (대통령·국회의원) — 2026 지방선거 아님
 */
const SG_TYPES: Array<{
  code: string;
  name: string;
  kind: 'individual' | 'party_proportional';
  needsWiwid: boolean;
}> = [
  { code: '3', name: '시·도지사', kind: 'individual', needsWiwid: false },
  { code: '11', name: '교육감', kind: 'individual', needsWiwid: false },
  { code: '4', name: '구·시·군의 장', kind: 'individual', needsWiwid: true },
  { code: '5', name: '시·도의원(지역구)', kind: 'individual', needsWiwid: true },
  // sgType=6: policy.nec UI 라벨 "구·시·군의회의원선거" = 기초의원 지역구.
  // 자치구당 평균 4개 선거구 × 평균 3명 = ~7,000명 (전국 최대 그룹).
  { code: '6', name: '구·시·군의원(지역구)', kind: 'individual', needsWiwid: true },
  { code: '8', name: '광역의원비례대표', kind: 'party_proportional', needsWiwid: false },
  { code: '9', name: '기초의원비례대표', kind: 'party_proportional', needsWiwid: true },
];

/**
 * 시·도 권역 리스트는 sgType별로 NEC에서 동적 fetch (`fetchRegionList`).
 * 2026 지방선거에서 **전남광주통합특별시(2900)** 등 신설 권역이 있어 sgType별로 다름.
 *
 * 백업: 기초장(sgType=4) 기준 표준 17개 시·도 매핑 — fetch 실패 시 폴백.
 */
const FALLBACK_SIDO: Array<{ code: string; name: string }> = [
  { code: '1100', name: '서울특별시' },
  { code: '2600', name: '부산광역시' },
  { code: '2700', name: '대구광역시' },
  { code: '2800', name: '인천광역시' },
  { code: '2900', name: '광주광역시' },
  { code: '3000', name: '대전광역시' },
  { code: '3100', name: '울산광역시' },
  { code: '5100', name: '세종특별자치시' },
  { code: '4100', name: '경기도' },
  { code: '5200', name: '강원특별자치도' },
  { code: '4300', name: '충청북도' },
  { code: '4400', name: '충청남도' },
  { code: '5300', name: '전북특별자치도' },
  { code: '4600', name: '전라남도' },
  { code: '4700', name: '경상북도' },
  { code: '4800', name: '경상남도' },
  { code: '4900', name: '제주특별자치도' },
];

/** 후보자별 수집 체크리스트 — 각 ingest 스크립트 실행 후 true. */
export interface CollectionChecklist {
  /** 02-parse-detail-html.ts — info.nec 정형 14필드. */
  necDetail: boolean;
  /** 03-fetch-promise-text.ts — 5대공약 + necElements. */
  necPromise: boolean;
  /** info.nec 사진 URL (02에서 같이 추출). */
  necPhoto: boolean;
  /** 06-fetch-wikidata.ts — 출생일 가드레일 통과 시만. */
  wikidata: boolean;
  /** 04-fetch-smc.ts — 서울 출신·시의원 경력자 한정. */
  smcCouncil: boolean;
  /** 05-fetch-peti.ts — 현직 공직자 한정 (수동 매칭). */
  petiBreakdown: boolean;
}

export interface ChecklistEntry {
  /**
   * Stable identifier.
   *  - individual: NEC huboid (예: "100154016")
   *  - party_proportional: 합성키 `pty:{sgTypecode}:{sggid}:{jdid}` (예: "pty:8:3110000:100")
   */
  id: string;
  kind: 'individual' | 'party_proportional';
  /** 개인 후보 한정. 정당비례는 빈 문자열. */
  huboId: string;
  /** 정당비례 한정. 개인은 빈 문자열. */
  jdId: string;
  name: string;
  party: string;
  /**
   * 지역구: NEC 후보 기호 (hbjgiho).
   * 비례: 명부 단위 표시용 0 (proportionalCount 별도).
   */
  ballotNumber: number;
  /** 정당비례: cnt = 정당명부에 등재된 후보 수. */
  proportionalCount: number;
  sgTypecode: string;
  sgTypeName: string;
  /**
   * 직책 프로파일 키 — `OFFICE_PROFILES[officeKind]` 로 5대공약 의무·정당 표시
   * 규칙 등 결정. policy.nec sgTypecode 7개 코드와 1:1 매핑.
   */
  officeKind: OfficeKind;
  sidoCode: string;
  sidoName: string;
  guCode: string;
  guName: string;
  sggId: string;
  sggName: string;
  ocrCnvrSeqNo?: string;
  bookletPdfPath?: string;
  promisePdfPath?: string;
  collected: CollectionChecklist;
  lastIndexedAt: string;
}

async function ensureSession(): Promise<{ jsid: string; cookies: string }> {
  const seed = await fetchText(`${BASE}/plc/commiment/initUCACommiment.do?menuId=CNDDT25`);
  const jsid = extractJsessionId(seed.cookies);
  if (!jsid) throw new Error('JSESSIONID 발급 실패');
  return { jsid, cookies: `JSESSIONID=${jsid}` };
}

const POST_HEADERS = {
  'X-Requested-With': 'XMLHttpRequest',
  Accept: 'application/json',
  Referer: `${BASE}/plc/commiment/initUCACommiment.do?menuId=CNDDT25`,
};

async function fetchRegionList(
  jsid: string,
  cookies: string,
  sgTypecode: string
): Promise<Array<{ code: string; name: string }>> {
  const subSgId = `${sgTypecode}${SG_ID}`;
  const res = await fetchJson<{ regionlist?: Array<{ wiwid: string; wiwname: string }> }>(
    `${BASE}/plc/commiment/initUCACommimentRegion.do;jsessionid=${jsid}`,
    {
      method: 'POST',
      cookies,
      headers: POST_HEADERS,
      body: new URLSearchParams({
        sgId: SG_ID,
        subSgId,
      }).toString(),
    }
  );
  return (res.regionlist ?? [])
    .map((r) => ({ code: String(r.wiwid ?? ''), name: String(r.wiwname ?? '') }))
    .filter((r) => r.code && r.name);
}

async function fetchGuList(
  jsid: string,
  cookies: string,
  sidoCode: string,
  sgTypecode: string
): Promise<Array<{ wiwid: string; wiwname: string }>> {
  const subSgId = `${sgTypecode}${SG_ID}`;
  const res = await fetchJson<{ gulist?: Array<{ wiwid: string; wiwname: string }> }>(
    `${BASE}/plc/commiment/initUCACommimentGu.do;jsessionid=${jsid}`,
    {
      method: 'POST',
      cookies,
      headers: POST_HEADERS,
      body: new URLSearchParams({
        sgId: SG_ID,
        subSgId,
        wiwsidocode: sidoCode,
      }).toString(),
    }
  );
  return (res.gulist ?? [])
    .map((g) => ({ wiwid: String(g.wiwid ?? ''), wiwname: String(g.wiwname ?? '') }))
    .filter((g) => g.wiwid && g.wiwname);
}

async function fetchSggList(
  jsid: string,
  cookies: string,
  sidoCode: string,
  guCode: string,
  sgTypecode: string
): Promise<Array<{ sggid: string; sggname: string }>> {
  const subSgId = `${sgTypecode}${SG_ID}`;
  const res = await fetchJson<{ sgglist?: Array<{ sggid: string; sggname: string }> }>(
    `${BASE}/plc/commiment/initUCACommimentSgg.do;jsessionid=${jsid}`,
    {
      method: 'POST',
      cookies,
      headers: POST_HEADERS,
      body: new URLSearchParams({
        sgId: SG_ID,
        subSgId,
        wiwsidocode: sidoCode,
        wiwid: guCode,
        sortYn: 'N',
      }).toString(),
    }
  );
  return (res.sgglist ?? [])
    .map((s) => ({ sggid: String(s.sggid ?? ''), sggname: String(s.sggname ?? '') }))
    .filter((s) => s.sggid);
}

async function fetchCandidateList(
  jsid: string,
  cookies: string,
  sidoCode: string,
  guCode: string,
  sggCode: string,
  sgTypecode: string
): Promise<Array<Record<string, unknown>>> {
  const subSgId = `${sgTypecode}${SG_ID}`;
  const res = await fetchJson<{ list?: Array<Record<string, unknown>> }>(
    `${BASE}/plc/commiment/initUCACommimentList.do;jsessionid=${jsid}`,
    {
      method: 'POST',
      cookies,
      headers: POST_HEADERS,
      body: new URLSearchParams({
        sgId: SG_ID,
        subSgId,
        hRegionId: sidoCode,
        hGuId: guCode,
        hSggId: sggCode,
        sgTypecode,
        pageIndex: '1',
        phGuId: '',
        elecEndYn: 'N',
      }).toString(),
    }
  );
  return res.list ?? [];
}

function parseFileInfo(fileinfo: string): {
  ocrCnvrSeqNo?: string;
  bookletPdfPath?: string;
  promisePdfPath?: string;
} {
  let ocrCnvrSeqNo: string | undefined;
  let bookletPdfPath: string | undefined;
  let promisePdfPath: string | undefined;
  for (const item of fileinfo.split(',')) {
    const parts = item.split('||');
    if (parts[0] === '선거공보' && parts[1]) bookletPdfPath = parts[1];
    if (parts[0] === '5대공약') {
      if (parts[1]) promisePdfPath = parts[1];
      if (parts[2]) ocrCnvrSeqNo = parts[2];
    }
  }
  return { ocrCnvrSeqNo, bookletPdfPath, promisePdfPath };
}

function emptyChecklist(): CollectionChecklist {
  return {
    necDetail: false,
    necPromise: false,
    necPhoto: false,
    wikidata: false,
    smcCouncil: false,
    petiBreakdown: false,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface CrawlFilter {
  sido?: string;
  sgType?: string;
  /** 디버그용 — 시·도 1개당 최대 구·시·군 수 제한. */
  maxGuPerSido?: number;
}

interface CrawlResult {
  entries: ChecklistEntry[];
  errors: Array<{ stage: string; ctx: string; msg: string }>;
  elapsedSec: string;
}

export async function crawl(filter: CrawlFilter = {}): Promise<CrawlResult> {
  const { jsid, cookies } = await ensureSession();
  const types = filter.sgType ? SG_TYPES.filter((t) => t.code === filter.sgType) : SG_TYPES;

  const entries: ChecklistEntry[] = [];
  const errors: Array<{ stage: string; ctx: string; msg: string }> = [];
  const start = Date.now();
  const now = () => new Date().toISOString();

  for (const type of types) {
    // sgType별로 시·도 권역 동적 fetch (2026 신설 권역 반영)
    let sidos: Array<{ code: string; name: string }>;
    try {
      sidos = await fetchRegionList(jsid, cookies, type.code);
      if (sidos.length === 0) sidos = FALLBACK_SIDO;
      await sleep(120);
    } catch (e) {
      errors.push({
        stage: 'regionList',
        ctx: `${type.name}`,
        msg: e instanceof Error ? e.message : String(e),
      });
      sidos = FALLBACK_SIDO;
    }

    if (filter.sido) sidos = sidos.filter((s) => s.code === filter.sido);

    console.error(`▸ [${type.name}] 시·도 ${sidos.length}개 권역 인덱싱 시작`);

    for (const sido of sidos) {
      let gus: Array<{ wiwid: string; wiwname: string }>;
      try {
        gus = type.needsWiwid
          ? await fetchGuList(jsid, cookies, sido.code, type.code)
          : [{ wiwid: '', wiwname: sido.name }];
        await sleep(120);
      } catch (e) {
        errors.push({
          stage: 'guList',
          ctx: `${type.name}/${sido.name}`,
          msg: e instanceof Error ? e.message : String(e),
        });
        continue;
      }

      if (filter.maxGuPerSido) gus = gus.slice(0, filter.maxGuPerSido);

      for (const gu of gus) {
        let sggs: Array<{ sggid: string; sggname: string }>;
        try {
          sggs = await fetchSggList(jsid, cookies, sido.code, gu.wiwid, type.code);
          await sleep(120);
        } catch (e) {
          errors.push({
            stage: 'sggList',
            ctx: `${type.name}/${sido.name}/${gu.wiwname}`,
            msg: e instanceof Error ? e.message : String(e),
          });
          continue;
        }

        // 광역 단위 또는 비례 선거는 sgg가 비어있을 수 있음 — 빈 sggid로 한 번 호출
        const effective =
          sggs.length > 0 ? sggs : [{ sggid: '', sggname: `${sido.name} ${gu.wiwname}`.trim() }];

        for (const sgg of effective) {
          try {
            const list = await fetchCandidateList(
              jsid,
              cookies,
              sido.code,
              gu.wiwid,
              sgg.sggid,
              type.code
            );
            for (const c of list) {
              const fileinfo = String(c['fileinfo'] ?? '');
              const parsed = parseFileInfo(fileinfo);
              const sggIdResolved = String(c['sggid'] ?? sgg.sggid);
              const sggNameResolved = String(c['sggname'] ?? sgg.sggname);

              const officeKind = SGTYPECODE_TO_OFFICE_KIND[type.code];
              if (!officeKind) continue;

              if (type.kind === 'individual') {
                const huboId = String(c['huboid'] ?? '');
                if (!huboId || huboId === 'None') continue;
                entries.push({
                  id: huboId,
                  kind: 'individual',
                  huboId,
                  jdId: '',
                  name: String(c['hbjname'] ?? ''),
                  party: String(c['jdname'] ?? ''),
                  ballotNumber: Number(c['hbjgiho'] ?? 0),
                  proportionalCount: 0,
                  sgTypecode: type.code,
                  sgTypeName: type.name,
                  officeKind,
                  sidoCode: sido.code,
                  sidoName: sido.name,
                  guCode: gu.wiwid,
                  guName: gu.wiwname,
                  sggId: sggIdResolved,
                  sggName: sggNameResolved,
                  ocrCnvrSeqNo: parsed.ocrCnvrSeqNo,
                  bookletPdfPath: parsed.bookletPdfPath,
                  promisePdfPath: parsed.promisePdfPath,
                  collected: emptyChecklist(),
                  lastIndexedAt: now(),
                });
              } else {
                const jdid = String(c['jdid'] ?? '');
                if (!jdid) continue;
                entries.push({
                  id: `pty:${type.code}:${sggIdResolved}:${jdid}`,
                  kind: 'party_proportional',
                  huboId: '',
                  jdId: jdid,
                  name: String(c['jdname'] ?? '') + ' 비례명부',
                  party: String(c['jdname'] ?? ''),
                  ballotNumber: 0,
                  proportionalCount: Number(c['cnt'] ?? 0),
                  sgTypecode: type.code,
                  sgTypeName: type.name,
                  officeKind,
                  sidoCode: sido.code,
                  sidoName: sido.name,
                  guCode: gu.wiwid,
                  guName: gu.wiwname,
                  sggId: sggIdResolved,
                  sggName: sggNameResolved,
                  ocrCnvrSeqNo: parsed.ocrCnvrSeqNo,
                  bookletPdfPath: parsed.bookletPdfPath,
                  promisePdfPath: parsed.promisePdfPath,
                  collected: emptyChecklist(),
                  lastIndexedAt: now(),
                });
              }
            }
            await sleep(120);
          } catch (e) {
            errors.push({
              stage: 'candidateList',
              ctx: `${type.name}/${sido.name}/${gu.wiwname}/${sgg.sggname}`,
              msg: e instanceof Error ? e.message : String(e),
            });
          }
        }
      }

      console.error(
        `  ✓ [${type.name}] ${sido.name}: 구 ${gus.length}개 → 누적 ${entries.length}명`
      );
    }
  }

  const elapsedSec = ((Date.now() - start) / 1000).toFixed(1);
  return { entries, errors, elapsedSec };
}

function buildSummary(entries: ChecklistEntry[]): {
  byType: Record<string, number>;
  bySido: Record<string, number>;
} {
  const byType: Record<string, number> = {};
  const bySido: Record<string, number> = {};
  for (const e of entries) {
    byType[e.sgTypeName] = (byType[e.sgTypeName] ?? 0) + 1;
    bySido[e.sidoName] = (bySido[e.sidoName] ?? 0) + 1;
  }
  return { byType, bySido };
}

function dedupe(entries: ChecklistEntry[]): ChecklistEntry[] {
  const map = new Map<string, ChecklistEntry>();
  for (const e of entries) {
    if (!map.has(e.id)) map.set(e.id, e);
  }
  return Array.from(map.values());
}

function parseCli(): {
  sido?: string;
  sgType?: string;
  maxGuPerSido?: number;
  outPath: string;
} {
  let sido: string | undefined;
  let sgType: string | undefined;
  let maxGuPerSido: number | undefined;
  let outPath = resolve(process.cwd(), 'data/curated/roster-2026.json');
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--(\w+)=(.+)$/);
    if (!m || !m[1] || !m[2]) continue;
    if (m[1] === 'sido') sido = m[2];
    else if (m[1] === 'sgType') sgType = m[2];
    else if (m[1] === 'maxGu') maxGuPerSido = Number(m[2]);
    else if (m[1] === 'out') outPath = m[2];
  }
  return { sido, sgType, maxGuPerSido, outPath };
}

async function main() {
  const { sido, sgType, maxGuPerSido, outPath } = parseCli();
  console.error(`▶ 전국 후보자 명부 수집 (sgId=${SG_ID})`);
  if (sido) console.error(`  필터: 시·도 ${sido}`);
  if (sgType) console.error(`  필터: 선거유형 ${sgType}`);
  if (maxGuPerSido) console.error(`  디버그: 시·도당 최대 ${maxGuPerSido}개 구·시·군`);

  const { entries, errors, elapsedSec } = await crawl({ sido, sgType, maxGuPerSido });
  const unique = dedupe(entries);

  const roster = {
    generatedAt: new Date().toISOString(),
    sgId: SG_ID,
    elapsedSec,
    summary: {
      totalCount: unique.length,
      duplicatesRemoved: entries.length - unique.length,
      ...buildSummary(unique),
    },
    errors,
    candidates: unique,
  };

  mkdirSync(resolve(outPath, '..'), { recursive: true });
  writeFileSync(outPath, JSON.stringify(roster, null, 2));
  console.error(`\n✅ 저장: ${outPath}`);
  console.error(
    `   총 ${unique.length}명 (중복 ${entries.length - unique.length}건 제거) / 에러 ${errors.length}건 / 소요 ${elapsedSec}s`
  );
}

if (process.argv[1]?.endsWith('01b-fetch-national-roster.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
