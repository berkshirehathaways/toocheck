/**
 * #14 §1-1 — NEC info.nec.go.kr 정형 페이지 파서.
 * 입력: huboid (NEC 후보 식별자)
 * 출력: 정형 14 필드 (이름·한자·생년월일·성별·주소·직업·학력·경력·재산총액·병역·납세·체납·전과·입후보 횟수)
 *
 * 사용:
 *   pnpm tsx scripts/ingest/02-parse-detail-html.ts 100154016
 *
 * 비-의존 정규식 파싱. 페이지 구조는 [라벨]\n[값] 패턴.
 */

import { fetchText, cheonwonToKrw } from './_common.js';

interface NecDetail {
  necId: string;
  name: string;
  nameHanja?: string;
  birthDate?: string;     // ISO YYYY-MM-DD
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
  sourceUrl: string;
  photoUrl?: string;
}

const INFO_BASE = 'http://info.nec.go.kr';

/** HTML → 라벨 키 → 값 문자열 매핑. <th>라벨</th><td>값</td> 패턴. */
function buildLabelMap(html: string): Map<string, string> {
  const map = new Map<string, string>();
  // <th>라벨</th> ... <td>값</td> 페어 추출 (탭/공백 허용)
  const pattern = /<th[^>]*>\s*([^<]+?)\s*<\/th>\s*(?:<\/tr>\s*<tr[^>]*>)?\s*<td[^>]*>([\s\S]*?)<\/td>/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(html))) {
    const labelRaw = m[1];
    const valueRaw = m[2];
    if (!labelRaw || !valueRaw) continue;
    const key = labelRaw.trim();
    const value = valueRaw
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    map.set(key, value);
  }
  return map;
}

function parseNumberFromCheonwon(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[^\d-]/g, '');
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isNaN(n) ? undefined : cheonwonToKrw(n);
}

export async function parseDetail(huboId: string, electionId = '0020260603'): Promise<NecDetail> {
  const url = `${INFO_BASE}/electioninfo/candidate_detail_info.xhtml?electionId=${electionId}&huboId=${huboId}`;
  const { text: html } = await fetchText(url);
  const map = buildLabelMap(html);

  const nameRaw = map.get('성명') ?? '';
  const nameMatch = nameRaw.match(/^([^\s(（]+)/);
  const hanjaMatch = nameRaw.match(/[(（]([^)）]+)[)）]/);

  const birthRaw = map.get('생년월일') ?? '';
  const birthDateMatch = birthRaw.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  const genderMatch = birthRaw.match(/\/\s*([남여])/);

  // 경력 — 여러 줄
  const careerRaw = map.get('경력') ?? '';
  const career = careerRaw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  // 전과
  const criminalRaw = map.get('전과기록유무(건수)') ?? map.get('전과기록유무') ?? '';
  const criminalMatch = criminalRaw.match(/(\d+)\s*건/);
  const criminalCount = criminalRaw.includes('없음')
    ? 0
    : criminalMatch
      ? Number(criminalMatch[1])
      : undefined;

  // 입후보 횟수
  const runRaw = map.get('입후보 횟수') ?? '';
  const runMatch = runRaw.match(/(\d+)\s*회/);

  // 사진 — fn_ClickPhoto 안에 있음
  const photoMatch = html.match(/fn_ClickPhoto\(['"]([^'"]+)['"]\)/);

  return {
    necId: huboId,
    name: nameMatch?.[1] ?? nameRaw.trim(),
    nameHanja: hanjaMatch?.[1],
    birthDate: birthDateMatch
      ? `${birthDateMatch[1]}-${birthDateMatch[2]}-${birthDateMatch[3]}`
      : undefined,
    birthYear: birthDateMatch ? Number(birthDateMatch[1]) : undefined,
    gender: genderMatch ? (genderMatch[1] === '남' ? 'M' : 'F') : undefined,
    occupation: map.get('직업'),
    education: map.get('학력'),
    career: career.length > 0 ? career : undefined,
    assetTotalKrw: parseNumberFromCheonwon(map.get('재산신고액(천원)')),
    militaryRecord: map.get('병역신고사항(본인)'),
    fiveYearTaxPaidKrw: parseNumberFromCheonwon(map.get('납부액(천원)')),
    fiveYearTaxArrearsKrw: parseNumberFromCheonwon(
      map.get('최근 5년간 체납액(천원)')
    ),
    currentTaxArrearsKrw: parseNumberFromCheonwon(map.get('현체납액(천원)')),
    criminalRecordCountSummary: criminalCount,
    electionRunCount: runMatch ? Number(runMatch[1]) : undefined,
    sourceUrl: url,
    photoUrl: photoMatch?.[1],
  };
}

async function main() {
  const huboId = process.argv[2];
  if (!huboId) throw new Error('사용: tsx 02-parse-detail-html.ts <huboid>');
  const detail = await parseDetail(huboId);
  console.log(JSON.stringify(detail, null, 2));
}

if (process.argv[1]?.endsWith('02-parse-detail-html.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export type { NecDetail };
