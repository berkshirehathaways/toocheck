/**
 * Phase 3 — 행정동(또는 법정동) 단위 광역의원·기초의원 선거구 정밀 매핑.
 *
 * 입력: bcode(법정동코드 10자리) + sido/sigungu/bname
 * 출력: { metropolitanSggId, basicSggId, ... } 또는 null
 *
 * 매핑은 시·도 조례 별표 / 공직선거법 별표 텍스트를 파싱한 정적 JSON에서 가져옴.
 * 커버되지 않은 시·도/시·군·구는 null 반환 → 호출 측에서 시·군·구 fallback 유지.
 */

import assemblyMapJson from '@/data/curated/assembly-district-map.json';
import { normalizeDong, sidoCandidates } from './normalize';

export interface AssemblyDistrictMapEntry {
  /** 광역의원(시·도의원) 선거구 sggId, 예: "5110101" */
  metropolitanSggId?: string;
  /** 광역의원 선거구명, 예: "종로구제1선거구" */
  metropolitanSggName?: string;
  /** 광역의원 후보 수 (NEC 등록 기준). */
  metropolitanCandidateCount?: number;

  /** 기초의원(구·시·군의원) 선거구 sggId, 예: "6110101" */
  basicSggId?: string;
  /** 기초의원 선거구명, 예: "종로구가선거구" */
  basicSggName?: string;
  /** 기초의원 후보 수 (NEC 등록 기준). */
  basicCandidateCount?: number;
  /** 매핑 출처 URL. */
  sourceUrls?: string[];
  /** 운영자 검수 필요 플래그. */
  needsReview?: boolean;
}

interface AssemblyDistrictMapFile {
  version: number;
  generatedAt: string;
  coverage: string[]; // 커버되는 시·도명 목록 (UI 안내)
  /**
   * 1차 키: bcode 10자리 (법정동코드).
   * 2차 키: hcode 10자리도 함께 매핑 (Phase 2에서 bcode→hcode 변환을 거치지 않아도 됨).
   */
  byBcode: Record<string, AssemblyDistrictMapEntry>;
  /**
   * fallback 키: `${sidoName}|${sigunguName}|${bname}` 문자열 매칭.
   * bcode가 비거나 매핑 미커버일 때 동명 + 시군구명 조합으로 한 번 더 시도.
   */
  byName: Record<string, AssemblyDistrictMapEntry>;
}

const MAP = assemblyMapJson as unknown as AssemblyDistrictMapFile;

export interface ResolveAssemblyInput {
  bcode?: string;
  sidoName?: string;
  sigunguName?: string;
  bname?: string;
  /** 행정동명. 카카오 hname 또는 bcode 보강을 통해 채워진다. */
  hname?: string;
}

export function resolveAssemblySggIds(
  input: ResolveAssemblyInput
): AssemblyDistrictMapEntry | null {
  const found: AssemblyDistrictMapEntry[] = [];

  // 1순위: bcode 직접 매칭
  if (input.bcode && MAP.byBcode[input.bcode]) found.push(MAP.byBcode[input.bcode]!);

  // 2·3순위: 행정동명(hname)/법정동명(bname) 매칭 — 별표가 행정동 단위로 기술됨.
  //          별표/카카오 표기 차이는 normalizeDong, 통합 시·도명 차이는 sidoCandidates로 흡수.
  // ⚠ 광역의원(별표2)은 "전남광주통합특별시" 키, 기초의원(조례)은 "광주광역시" 키로 갈릴 수 있어
  //   모든 후보 키를 모아 metropolitan/basic 을 병합한다.
  if (input.sidoName && input.sigunguName) {
    const sidos = sidoCandidates(input.sidoName);
    for (const dongRaw of [input.hname, input.bname]) {
      if (!dongRaw) continue;
      const dong = normalizeDong(dongRaw);
      for (const sido of sidos) {
        const hit = MAP.byName[`${sido}|${input.sigunguName}|${dong}`];
        if (hit) found.push(hit);
      }
    }
  }

  if (found.length === 0) return null;

  // 병합: metropolitan / basic 각각 최초로 발견된 값을 채택.
  const merged: AssemblyDistrictMapEntry = {};
  const srcUrls = new Set<string>();
  let needsReview = false;
  for (const e of found) {
    if (merged.metropolitanSggId === undefined && e.metropolitanSggId !== undefined) {
      merged.metropolitanSggId = e.metropolitanSggId;
      merged.metropolitanSggName = e.metropolitanSggName;
      merged.metropolitanCandidateCount = e.metropolitanCandidateCount;
    }
    if (merged.basicSggId === undefined && e.basicSggId !== undefined) {
      merged.basicSggId = e.basicSggId;
      merged.basicSggName = e.basicSggName;
      merged.basicCandidateCount = e.basicCandidateCount;
    }
    if (e.needsReview) needsReview = true;
    for (const u of e.sourceUrls ?? []) srcUrls.add(u);
  }
  merged.sourceUrls = Array.from(srcUrls);
  merged.needsReview = needsReview;
  return merged;
}

export function assemblyDistrictMapMetadata() {
  return {
    version: MAP.version,
    generatedAt: MAP.generatedAt,
    coverage: MAP.coverage,
    bcodeCount: Object.keys(MAP.byBcode).length,
    nameCount: Object.keys(MAP.byName).length,
  };
}

/** 조례 동 단위 매핑이 적용되는 시·군·구인지. coverage 항목은 "시·도명 시·군·구명" 형식. */
export function isCovered(sidoName: string, sigunguName?: string): boolean {
  const sidos = sidoCandidates(sidoName);
  if (sigunguName) return sidos.some((s) => MAP.coverage.includes(`${s} ${sigunguName}`));
  return sidos.some((s) => MAP.coverage.some((c) => c.startsWith(`${s} `)));
}
