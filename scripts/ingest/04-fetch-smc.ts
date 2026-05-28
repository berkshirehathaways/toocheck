/**
 * #14 §1-5 — 서울시의회 의정활동 (smc.seoul.kr).
 * 입력: mno (의원 식별자), period (대수)
 * 출력: 영문명·지역구·관할동·위원회 활동 목록·학력
 *
 * §17 의심 단어("의혹", "위반" 등) 포함 위원회는 needsReview=true.
 *
 * 사용:
 *   pnpm tsx scripts/ingest/04-fetch-smc.ts 872 9
 */

import { fetchText } from './_common.js';
import { FORBIDDEN_WORDS } from '../../lib/forbidden-words.js';

interface SmcMember {
  mno: string;
  period: number;
  name: string;
  nameHanja?: string;
  nameEnglish?: string;
  birthYear?: number;
  party?: string;
  district?: string;
  dongList: string[];
  councilTerms: SmcTerm[];
  education?: string;
  priorCareer?: string[];
  sourceUrl: string;
}

interface SmcTerm {
  position: string;
  start: string;            // YYYY-MM-DD
  end: string;
  needsReview: boolean;
  displayLabel?: string;     // §17 단어 포함 시 운영자 검수용 축약명
}

const BASE = 'https://www.smc.seoul.kr';

export async function fetchSmcMember(mno: string, period: number): Promise<SmcMember> {
  const url = `${BASE}/main/memberPop.do?mno=${mno}&period=${period}`;
  const { text: html } = await fetchText(url, {
    headers: { Referer: `${BASE}/main/councilMember.do?period=${period}` },
  });

  const clean = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  // 이름 + 한자 + 영문
  const nameMatch = clean.match(/의원명\s+(\S+?)\s*\(([^)]+)\)\s+([A-Z][a-zA-Z\s]+?)(?:\s+출생연도)/);
  const birthMatch = clean.match(/출생연도\s+(\d{4})년/);
  const partyMatch = clean.match(/소속정당\s+(\S+)/);
  const districtMatch = clean.match(/지역구\s+([^(]+?)\s*\(([^)]+)\)/);
  const dongs = districtMatch?.[2]
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

  // 시의회 경력 8건 패턴: "위원회명(시작 ~ 종료)"
  // 헤더("시의회 경력, 학력 ...")가 먼저 등장하므로 [N대] 마커부터 학력 마커까지 추출
  const careerSection =
    clean.match(/\[\d+대\][\s\S]+?(?=학력 및 기타 경력|$)/)?.[0] ?? '';
  const termPattern = /([^()]+?)\((\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\)/g;
  const councilTerms: SmcTerm[] = [];
  let tm: RegExpExecArray | null;
  while ((tm = termPattern.exec(careerSection))) {
    const positionRaw = tm[1];
    const startStr = tm[2];
    const endStr = tm[3];
    if (!positionRaw || !startStr || !endStr) continue;
    const position = positionRaw.trim().replace(/^\[?\d+대\]?\s*/, '');
    const hasForbidden = FORBIDDEN_WORDS.some((w) => position.includes(w));
    councilTerms.push({
      position,
      start: startStr,
      end: endStr,
      needsReview: hasForbidden,
      displayLabel: hasForbidden
        ? position.replace(/(특혜)?의혹\s*/g, '').trim()
        : undefined,
    });
  }

  // 학력 및 기타 경력
  const eduSection = clean.match(/학력 및 기타 경력([\s\S]+?)$/)?.[1] ?? '';
  const eduMatch = eduSection.match(/(연세대학교|고려대학교|서울대학교|한양대학교|동국대학교|성균관대학교|이화여자대학교|숙명여자대학교)[^,()]+/);
  const careerLines = eduSection
    .split(/(?<=[가-힣\d])\s+(?=\()/)
    .map((s) => s.trim())
    .filter((s) => /\(전\)|\(현\)/.test(s));

  return {
    mno,
    period,
    name: nameMatch?.[1] ?? '',
    nameHanja: nameMatch?.[2]?.trim(),
    nameEnglish: nameMatch?.[3]?.trim(),
    birthYear: birthMatch ? Number(birthMatch[1]) : undefined,
    party: partyMatch?.[1],
    district: districtMatch?.[1]?.trim(),
    dongList: dongs,
    councilTerms,
    education: eduMatch?.[0]?.trim(),
    priorCareer: careerLines.length > 0 ? careerLines : undefined,
    sourceUrl: url,
  };
}

async function main() {
  const mno = process.argv[2];
  const period = Number(process.argv[3] ?? '9');
  if (!mno) throw new Error('사용: tsx 04-fetch-smc.ts <mno> <period>');
  const member = await fetchSmcMember(mno, period);
  console.log(JSON.stringify(member, null, 2));
}

if (process.argv[1]?.endsWith('04-fetch-smc.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export type { SmcMember, SmcTerm };
