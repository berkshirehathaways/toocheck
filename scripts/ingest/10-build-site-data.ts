/**
 * #15 후속 — 수집 산출물 → 사이트 데이터 변환.
 *
 * 입력:
 *   data/curated/roster-2026.json          (개인 후보 인덱스 + officeKind)
 *   data/curated/{huboId}_detail.json       (정형 14필드)
 *   data/curated/{huboId}_promise.json      (5대공약)
 *   data/curated/{huboId}_wiki.json         (Wikidata 가드레일 통과분)
 *
 * 출력:
 *   data/curated/site-data.json
 *     { generatedAt, districts[], candidates[], disclosures[], promises[] }
 *
 * loader.ts가 이 파일을 읽어 전국 후보를 사이트에 노출.
 * 정당명부(party_proportional)는 후보 단위가 아니므로 제외 (개인 후보만).
 *
 * 사용: pnpm tsx scripts/ingest/10-build-site-data.ts
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type {
  Candidate,
  CandidateDisclosure,
  CandidatePromise,
  CouncilTerm,
  District,
  OfficeKind,
  PromiseCategory,
} from '../../types/domain.js';
import { OFFICE_PROFILES } from '../../types/domain.js';

const CURATED = resolve(process.cwd(), 'data/curated');
const ROSTER_PATH = resolve(CURATED, 'roster-2026.json');
const OUT_PATH = resolve(CURATED, 'site-data.json');
const ELECTION_ID = 'election_2026_local';
const TODAY = '2026-05-29';

interface RosterEntry {
  id: string;
  kind: 'individual' | 'party_proportional';
  huboId: string;
  name: string;
  party: string;
  ballotNumber: number;
  proportionalCount: number;
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

interface DetailJson {
  necId: string;
  name: string;
  nameHanja?: string;
  birthDate?: string;
  birthYear?: number;
  gender?: 'M' | 'F';
  occupation?: string;
  education?: string;
  career?: string[];
  assetTotalKrw?: number;
  militaryRecord?: string;
  fiveYearTaxPaidKrw?: number;
  fiveYearTaxArrearsKrw?: number;
  currentTaxArrearsKrw?: number;
  criminalRecordCountSummary?: number;
  electionRunCount?: number;
  sourceUrl?: string;
  photoUrl?: string;
}

interface PromiseJson {
  huboId: string;
  ocrCnvrSeqNo: string;
  promises: Array<{
    orderNo: number;
    title: string;
    body: string;
    necElements?: {
      goal: boolean;
      method: boolean;
      period: boolean;
      funding: boolean;
      indicator: boolean;
    };
  }>;
}

interface WikiJson {
  qid?: string;
  matched?: boolean;
  verifiedByBirthDate?: boolean;
  positions?: Array<{
    position: string;
    start?: string;
    end?: string;
    electoralDistrict?: string;
  }>;
  highSchool?: string;
  sourceUrl?: string;
  sourceLicense?: 'public_record' | 'CC0' | 'CC BY-SA 4.0';
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

/** officeKind별 직책명 (구·시·군의 장은 명칭 다양 → guName 접미사 추정). */
function positionTitle(kind: OfficeKind, guName: string): string {
  switch (kind) {
    case 'metropolitan_governor':
      return '시·도지사';
    case 'education_superintendent':
      return '교육감';
    case 'basic_governor':
      if (guName.endsWith('시')) return '시장';
      if (guName.endsWith('군')) return '군수';
      return '구청장';
    case 'metropolitan_member':
      return '시·도의원';
    case 'basic_member':
      return '구·시·군의원';
    default:
      return '후보';
  }
}

/** District 식별자 — 선거 단위(sgTypecode + 선거구). */
function districtId(e: RosterEntry): string {
  const unit = e.sggId || e.guCode || e.sidoCode;
  return `dist_${e.sgTypecode}_${unit}`;
}

/** District 표시명. */
function districtName(e: RosterEntry): string {
  switch (e.officeKind) {
    case 'metropolitan_governor':
      return `${e.sidoName} ${positionTitle(e.officeKind, e.guName)}`;
    case 'education_superintendent':
      return `${e.sidoName} 교육감`;
    case 'basic_governor':
      return `${e.guName} ${positionTitle(e.officeKind, e.guName)}`;
    case 'metropolitan_member':
    case 'basic_member':
      return e.sggName || `${e.guName} 선거구`;
    default:
      return e.sggName || e.guName || e.sidoName;
  }
}

/** Wikidata positions → CouncilTerm[]. */
function toCouncilTerms(wiki: WikiJson | null): CouncilTerm[] | undefined {
  if (!wiki?.positions || wiki.positions.length === 0) return undefined;
  const terms: CouncilTerm[] = [];
  for (const p of wiki.positions) {
    if (!p.position || !p.start) continue;
    terms.push({
      council: p.position,
      position: p.position,
      start: p.start,
      end: p.end ?? '',
      electoralDistrict: p.electoralDistrict,
      sourceUrl: wiki.sourceUrl ?? 'https://www.wikidata.org',
      sourceLicense: wiki.sourceLicense ?? 'CC0',
    });
  }
  return terms.length > 0 ? terms : undefined;
}

function main() {
  const roster = readJson<{ candidates: RosterEntry[] }>(ROSTER_PATH);
  if (!roster) throw new Error(`roster 없음: ${ROSTER_PATH}`);

  const individuals = roster.candidates.filter(
    (c) => c.kind === 'individual' && c.huboId
  );

  const districtMap = new Map<string, District>();
  const candidates: Candidate[] = [];
  const disclosures: CandidateDisclosure[] = [];
  const promises: CandidatePromise[] = [];

  let withDetail = 0;
  let withPromise = 0;
  let withWiki = 0;

  for (const e of individuals) {
    const dId = districtId(e);
    if (!districtMap.has(dId)) {
      districtMap.set(dId, {
        id: dId,
        electionId: ELECTION_ID,
        name: districtName(e),
        region: e.sidoName,
        positionTitle: positionTitle(e.officeKind, e.guName),
      });
    }

    const detail = readJson<DetailJson>(resolve(CURATED, `${e.huboId}_detail.json`));
    const promiseData = readJson<PromiseJson>(
      resolve(CURATED, `${e.huboId}_promise.json`)
    );
    const wiki = readJson<WikiJson>(resolve(CURATED, `${e.huboId}_wiki.json`));
    if (detail) withDetail++;
    if (promiseData) withPromise++;
    if (wiki?.qid) withWiki++;

    const profile = OFFICE_PROFILES[e.officeKind];
    const councilTerms = toCouncilTerms(wiki);

    const candidate: Candidate = {
      id: e.huboId,
      districtId: dId,
      electionId: ELECTION_ID,
      ballotNumber: e.ballotNumber,
      name: e.name,
      // 교육감은 정당 비표시 (법률상 무소속)
      party: profile.partyAffiliated ? e.party : '',
      birthYear: detail?.birthYear,
      status: 'active',
      reviewStatus: 'reviewed', // NEC 원본 — 사실 기반
      reviewedBy: 'nec_import',
      officeKind: e.officeKind,
      proportionalRank: profile.isProportional ? e.ballotNumber : undefined,
      ...(detail
        ? {
            nameHanja: detail.nameHanja,
            birthDate: detail.birthDate,
            gender: detail.gender,
            occupation: detail.occupation,
            education: detail.education,
            career: detail.career,
            electionRunCount: detail.electionRunCount,
          }
        : {}),
      ...(wiki?.highSchool ? { highSchool: wiki.highSchool } : {}),
      ...(councilTerms ? { councilTerms } : {}),
    };
    candidates.push(candidate);

    // Disclosure (detail 있을 때만)
    if (detail) {
      disclosures.push({
        candidateId: e.huboId,
        assetTotal: detail.assetTotalKrw ?? 0,
        // TIF 분해 자료 없음 — 인라인 막대는 미상(0) 처리
        assetBreakdown: { realEstate: 0, deposit: 0, securities: 0, other: 0 },
        criminalRecords: [],
        taxArrears: [],
        militaryRecord: detail.militaryRecord ?? '',
        sourceUrls: detail.sourceUrl ? [detail.sourceUrl] : [],
        sourcePublishedAt: TODAY,
        sourceCheckedAt: TODAY,
        fiveYearTaxPaidKrw: detail.fiveYearTaxPaidKrw,
        fiveYearTaxArrearsKrw: detail.fiveYearTaxArrearsKrw,
        currentTaxArrearsKrw: detail.currentTaxArrearsKrw,
        photoUrl: detail.photoUrl,
        criminalRecordCountSummary: detail.criminalRecordCountSummary,
      });
    }

    // Promises (promise JSON 있을 때만)
    if (promiseData?.promises) {
      for (const p of promiseData.promises) {
        const elems = p.necElements;
        const score = elems
          ? [elems.goal, elems.method, elems.period, elems.funding, elems.indicator].filter(
              Boolean
            ).length
          : 0;
        promises.push({
          id: `${e.huboId}_p${p.orderNo}`,
          candidateId: e.huboId,
          orderNo: p.orderNo,
          title: p.title,
          body: p.body,
          category: 'other' as PromiseCategory, // 중립성 — 자동 분류 안 함
          specificityScore: score,
          source: 'nec_policy',
          sourceUrl: detail?.sourceUrl,
          necElements: elems,
        });
      }
    }
  }

  const out = {
    generatedAt: new Date().toISOString(),
    counts: {
      districts: districtMap.size,
      candidates: candidates.length,
      disclosures: disclosures.length,
      promises: promises.length,
      withDetail,
      withPromise,
      withWiki,
    },
    districts: Array.from(districtMap.values()),
    candidates,
    disclosures,
    promises,
  };

  writeFileSync(OUT_PATH, JSON.stringify(out));
  console.error(`✅ 저장: ${OUT_PATH}`);
  console.error(
    `   districts=${districtMap.size} candidates=${candidates.length} disclosures=${disclosures.length} promises=${promises.length}`
  );
  console.error(`   detail=${withDetail} promise=${withPromise} wiki=${withWiki}`);
}

if (process.argv[1]?.endsWith('10-build-site-data.ts')) {
  main();
}
