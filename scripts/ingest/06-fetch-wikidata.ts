/**
 * #14 §1-7 — Wikidata 정형 데이터 + 가드레일.
 * 입력: 이름, NEC 출생일(ISO YYYY-MM-DD)
 * 출력: 출신고 + 정치 직위(임기·지역구). 출생일 일치 검증 통과 시만.
 *
 * 가드레일: 동명이인 자동 인용 방지.
 *
 * 사용:
 *   pnpm tsx scripts/ingest/06-fetch-wikidata.ts "정문헌" "1966-05-04"
 */

interface WikidataResult {
  qid: string;
  verifiedByBirthDate: true;
  highSchool?: string;
  positions: Array<{
    position: string;     // 예: "대한민국 국회의원"
    start: string;        // ISO YYYY-MM-DD
    end: string;
    electoralDistrict?: string;
  }>;
  sourceUrl: string;
  sourceLicense: 'CC0';
}

const API = 'https://www.wikidata.org/w/api.php';
const SPARQL = 'https://query.wikidata.org/sparql';

async function wbSearchEntities(name: string): Promise<string[]> {
  const url = new URL(API);
  url.searchParams.set('action', 'wbsearchentities');
  url.searchParams.set('search', name);
  url.searchParams.set('language', 'ko');
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '10');
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'toocheck/0.1 (support@omofictions.com)',
    },
  });
  if (!res.ok) {
    throw new Error(`wbsearchentities ${res.status}: ${(await res.text()).slice(0, 80)}`);
  }
  const d = await res.json();
  return (d.search ?? []).map((s: { id: string }) => s.id);
}

async function sparql<T = Record<string, { value: string }>>(
  query: string
): Promise<T[]> {
  const url = new URL(SPARQL);
  url.searchParams.set('query', query);
  const res = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      'User-Agent': 'toocheck/0.1 (support@omofictions.com)',
    },
  });
  const d = await res.json();
  return d.results?.bindings ?? [];
}

async function getBirthDate(qid: string): Promise<string | null> {
  const rows = await sparql<{ dob: { value: string } }>(
    `SELECT ?dob WHERE { wd:${qid} wdt:P569 ?dob } LIMIT 1`
  );
  return rows[0]?.dob?.value?.slice(0, 10) ?? null;
}

/**
 * 가드레일 적용 후보 식별.
 * 같은 이름의 여러 Q ID 중 NEC 출생일과 일치하는 첫 번째만 반환.
 */
async function findVerifiedQid(name: string, necBirthDate: string): Promise<string | null> {
  const candidates = await wbSearchEntities(name);
  for (const qid of candidates) {
    const wdBirth = await getBirthDate(qid);
    if (wdBirth === necBirthDate) return qid;
  }
  return null;
}

export async function fetchWikidata(
  name: string,
  necBirthDate: string
): Promise<WikidataResult | null> {
  const qid = await findVerifiedQid(name, necBirthDate);
  if (!qid) return null; // 가드레일 실패 시 0건 반환 (안전 폴백)

  // 직위 이력 (국회의원·시의원 등 임기·지역구)
  const positions = await sparql<{
    positionLabel: { value: string };
    start?: { value: string };
    end?: { value: string };
    electorateLabel?: { value: string };
  }>(
    `SELECT ?positionLabel ?start ?end ?electorateLabel WHERE {
      wd:${qid} p:P39 ?stmt.
      ?stmt ps:P39 ?position.
      OPTIONAL { ?stmt pq:P580 ?start. }
      OPTIONAL { ?stmt pq:P582 ?end. }
      OPTIONAL { ?stmt pq:P768 ?electorate. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }
    } ORDER BY ?start`
  );

  // 학력 (고등학교)
  const schools = await sparql<{ schoolLabel: { value: string } }>(
    `SELECT ?schoolLabel WHERE {
      wd:${qid} wdt:P69 ?school.
      ?school wdt:P31/wdt:P279* wd:Q149566.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }
    } LIMIT 5`
  );
  // P31=instance of, P279*=subclass of*, Q149566=secondary school (대체 표현)
  // 위 쿼리가 빈 결과면 일반 educated at 사용
  let highSchool: string | undefined;
  if (schools.length === 0) {
    const allEdu = await sparql<{ schoolLabel: { value: string } }>(
      `SELECT ?schoolLabel WHERE {
        wd:${qid} wdt:P69 ?school.
        ?school rdfs:label ?schoolLabel.
        FILTER(LANG(?schoolLabel) = "ko")
        FILTER(CONTAINS(?schoolLabel, "고등학교"))
      } LIMIT 1`
    );
    highSchool = allEdu[0]?.schoolLabel?.value;
  } else {
    highSchool = schools[0]?.schoolLabel?.value;
  }

  return {
    qid,
    verifiedByBirthDate: true,
    highSchool,
    positions: positions.map((p) => ({
      position: p.positionLabel.value,
      start: p.start?.value?.slice(0, 10) ?? '',
      end: p.end?.value?.slice(0, 10) ?? '',
      electoralDistrict: p.electorateLabel?.value,
    })),
    sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
    sourceLicense: 'CC0',
  };
}

async function main() {
  const name = process.argv[2];
  const birth = process.argv[3];
  if (!name || !birth)
    throw new Error('사용: tsx 06-fetch-wikidata.ts <name> <birthDate ISO>');
  const result = await fetchWikidata(name, birth);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith('06-fetch-wikidata.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export type { WikidataResult };
