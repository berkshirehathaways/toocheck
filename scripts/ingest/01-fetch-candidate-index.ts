/**
 * #14 §1-2 — NEC policy.nec 4단계 인덱싱.
 * 입력: sgId, subSgId(선거종류), wiwsidocode(시도), wiwid(구), sortYn
 * 출력: 선거구별 후보 리스트 (huboid·hbjname·ballotNumber·jdname·fileinfo)
 *
 * 사용:
 *   pnpm tsx scripts/ingest/01-fetch-candidate-index.ts \
 *     --sgId=20260603 --subSgId=420260603 --wiwsidocode=1100 --wiwid=1101
 */

import { fetchText, fetchJson, extractJsessionId } from './_common.js';

interface PolicyArgs {
  sgId: string;
  subSgId: string;
  wiwsidocode: string;
  wiwid: string;
  sortYn?: 'Y' | 'N';
}

interface PolicyCandidate {
  huboid: string;
  hbjname: string;
  hbjgiho: number;
  jdname: string;
  sggid: string;
  sggname: string;
  fileinfo: string;
  /** 5대공약 OCR 텍스트 식별자 (UELPromisePopupView 입력). */
  ocrCnvrSeqNo?: string;
  /** 정보공개 PDF 경로 (선거공보). */
  bookletPdfPath?: string;
  /** 5대공약 PDF 경로. */
  promisePdfPath?: string;
}

const BASE = 'https://policy.nec.go.kr';

async function fetchIndex(args: PolicyArgs): Promise<PolicyCandidate[]> {
  // 1) 세션 발급
  const seed = await fetchText(`${BASE}/plc/commiment/initUCACommiment.do?menuId=CNDDT25`);
  const jsid = extractJsessionId(seed.cookies);
  if (!jsid) throw new Error('JSESSIONID 발급 실패');
  const cookies = `JSESSIONID=${jsid}`;

  // 2) 선거구 sggid 조회 (initUCACommimentSgg.do)
  const sggRes = await fetchJson<{ sgglist: Array<{ sggid: string; sggname: string }> }>(
    `${BASE}/plc/commiment/initUCACommimentSgg.do;jsessionid=${jsid}`,
    {
      method: 'POST',
      cookies,
      headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
      body: new URLSearchParams({
        sgId: args.sgId,
        subSgId: args.subSgId,
        wiwsidocode: args.wiwsidocode,
        wiwid: args.wiwid,
        sortYn: args.sortYn ?? 'N',
      }).toString(),
    }
  );

  const results: PolicyCandidate[] = [];
  for (const sgg of sggRes.sgglist) {
    // 3) 후보 리스트 (initUCACommimentList.do)
    const listRes = await fetchJson<{ list: Array<Record<string, unknown>> }>(
      `${BASE}/plc/commiment/initUCACommimentList.do;jsessionid=${jsid}`,
      {
        method: 'POST',
        cookies,
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        body: new URLSearchParams({
          sgId: args.sgId,
          subSgId: args.subSgId,
          hRegionId: args.wiwsidocode,
          hGuId: args.wiwid,
          hSggId: sgg.sggid,
          sgTypecode: '4', // 구·시·군의 장
          pageIndex: '1',
          phGuId: '',
          elecEndYn: 'N',
        }).toString(),
      }
    );

    for (const c of listRes.list) {
      const fileinfo = String(c['fileinfo'] ?? '');
      // fileinfo 파싱: "선거공보||{PDF}||...,5대공약||{PDF}||{ocrCnvrSeqNo}||..."
      const items = fileinfo.split(',');
      let ocrCnvrSeqNo: string | undefined;
      let bookletPdfPath: string | undefined;
      let promisePdfPath: string | undefined;
      for (const item of items) {
        const parts = item.split('||');
        if (parts[0] === '선거공보' && parts[1]) bookletPdfPath = parts[1];
        if (parts[0] === '5대공약') {
          if (parts[1]) promisePdfPath = parts[1];
          if (parts[2]) ocrCnvrSeqNo = parts[2];
        }
      }
      results.push({
        huboid: String(c['huboid']),
        hbjname: String(c['hbjname']),
        hbjgiho: Number(c['hbjgiho']),
        jdname: String(c['jdname']),
        sggid: String(c['sggid']),
        sggname: String(c['sggname']),
        fileinfo,
        ocrCnvrSeqNo,
        bookletPdfPath,
        promisePdfPath,
      });
    }
  }
  return results;
}

function parseArgs(): PolicyArgs {
  const args: Partial<PolicyArgs> = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--(\w+)=(.+)$/);
    if (m && m[1] && m[2]) (args as Record<string, string>)[m[1]] = m[2];
  }
  if (!args.sgId || !args.subSgId || !args.wiwsidocode || !args.wiwid) {
    throw new Error(
      '필수 인자 누락: --sgId=20260603 --subSgId=420260603 --wiwsidocode=1100 --wiwid=1101'
    );
  }
  return args as PolicyArgs;
}

async function main() {
  const candidates = await fetchIndex(parseArgs());
  console.log(JSON.stringify(candidates, null, 2));
}

if (process.argv[1]?.endsWith('01-fetch-candidate-index.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { fetchIndex };
export type { PolicyCandidate, PolicyArgs };
