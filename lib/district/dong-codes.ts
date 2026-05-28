/**
 * 법정동코드(bcode) → 행정동명(hname) 보강 룩업.
 *
 * 카카오 우편번호 응답은 대부분의 도시 주소에 대해 `hname`을 채워주지만,
 * 일부 누락 케이스(군부대·읍면, 행정동 통폐합 직후 등)에 대비해 정적 매핑을 보강.
 *
 * 데이터: data/curated/bcode-to-hdong.json
 * 빌더:   scripts/ingest/09-build-dong-codes.ts
 */

import bcodeMapJson from '@/data/curated/bcode-to-hdong.json';

export interface BcodeMappingEntry {
  sido: string;
  sigungu: string;
  bname: string;
  hname: string;
}

interface BcodeMapFile {
  version: number;
  generatedAt: string;
  notes?: string[];
  coverage: string[];
  count: number;
  byBcode: Record<string, BcodeMappingEntry>;
}

const MAP = bcodeMapJson as unknown as BcodeMapFile;

/** bcode(10자리) → { sido, sigungu, bname, hname } */
export function resolveBcode(bcode: string | undefined | null): BcodeMappingEntry | null {
  if (!bcode) return null;
  return MAP.byBcode[bcode] ?? null;
}

/**
 * hname 강화 — kakao 응답에 hname이 비어 있을 때 bcode로 보강.
 * 우선순위: kakao hname (비어 있지 않으면) > bcode 매핑 hname > null.
 */
export function preferHname(opts: {
  bcode?: string | null;
  kakaoHname?: string | null;
}): string | null {
  if (opts.kakaoHname && opts.kakaoHname.trim() !== '') return opts.kakaoHname.trim();
  const m = resolveBcode(opts.bcode);
  return m?.hname ?? null;
}

export function dongCodesMetadata() {
  return {
    version: MAP.version,
    generatedAt: MAP.generatedAt,
    coverage: MAP.coverage,
    count: MAP.count,
  };
}
