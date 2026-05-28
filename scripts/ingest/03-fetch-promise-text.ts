/**
 * #14 §1-3 — NEC 공약 OCR 텍스트.
 * 입력: ocrCnvrSeqNo (01-fetch-candidate-index 출력의 ocrCnvrSeqNo)
 * 출력: 5대공약 본문 + NEC 4요소 자동 판정
 *
 * 사용:
 *   pnpm tsx scripts/ingest/03-fetch-promise-text.ts 11610
 */

import { fetchText, extractJsessionId } from './_common.js';

interface ParsedPromise {
  orderNo: number;
  title: string;
  body: string;
  necElements: {
    goal: boolean;       // "목 표" or "목표"
    method: boolean;     // "이행방법"
    period: boolean;     // "이행기간"
    funding: boolean;    // "재원조달방안"
    indicator: boolean;  // "지표" (드뭄)
  };
}

const BASE = 'https://policy.nec.go.kr';

export async function fetchPromises(ocrCnvrSeqNo: string): Promise<ParsedPromise[]> {
  // 세션 발급
  const seed = await fetchText(`${BASE}/plc/commiment/initUCACommiment.do?menuId=CNDDT25`);
  const jsid = extractJsessionId(seed.cookies);
  if (!jsid) throw new Error('JSESSIONID 발급 실패');

  // 공약 본문 (PopupView)
  const { text: html } = await fetchText(
    `${BASE}/plc/commiment/UELPromisePopupView.do;jsessionid=${jsid}`,
    {
      method: 'POST',
      cookies: `JSESSIONID=${jsid}`,
      body: new URLSearchParams({
        ocrCnvrSeqNo,
        menuName: '제9회 전국동시지방선거',
      }).toString(),
    }
  );

  return parsePromises(html);
}

function parsePromises(html: string): ParsedPromise[] {
  // <script>/<style> 제거
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');

  const promises: ParsedPromise[] = [];
  // "1." ... "2." ... "3." 패턴으로 분리. 공약 본문은 다음 번호 전까지.
  const segments: { num: number; rest: string }[] = [];
  const numberPattern = /(?<=\s|^)(\d)\.\s+/g;
  const matches = [...clean.matchAll(numberPattern)];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (!m || !m[1]) continue;
    const num = Number(m[1]);
    if (num < 1 || num > 5) continue;
    const start = (m.index ?? 0) + m[0].length;
    const next = matches[i + 1];
    const end = next?.index ?? clean.length;
    segments.push({ num, rest: clean.slice(start, end) });
  }

  // 5개 공약만 (중복 번호는 첫 번째만)
  const seenNums = new Set<number>();
  for (const seg of segments) {
    if (seenNums.has(seg.num) || seg.num > 5) continue;
    seenNums.add(seg.num);

    // 제목 = 첫 줄 (목 표 등이 나오기 전까지)
    const titleMatch = seg.rest.match(/^(.{5,120}?)(?=\s*(?:공약 내용 펼치기|□|목\s*표|목표|이행방법))/);
    const title = (titleMatch?.[1] ?? seg.rest.slice(0, 80)).trim();
    const body = seg.rest.trim().slice(0, 2000);

    promises.push({
      orderNo: seg.num,
      title,
      body,
      necElements: {
        goal: /목\s*표|목표/.test(body),
        method: /이행방법/.test(body),
        period: /이행기간/.test(body),
        funding: /재원\s*조달/.test(body),
        indicator: /지표/.test(body),
      },
    });
  }
  return promises.sort((a, b) => a.orderNo - b.orderNo);
}

async function main() {
  const seq = process.argv[2];
  if (!seq) throw new Error('사용: tsx 03-fetch-promise-text.ts <ocrCnvrSeqNo>');
  const promises = await fetchPromises(seq);
  console.log(JSON.stringify(promises, null, 2));
}

if (process.argv[1]?.endsWith('03-fetch-promise-text.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export type { ParsedPromise };
