/**
 * 시·군·구별 후보 인덱스 로더 (서버 전용).
 *
 * 빌더: scripts/ingest/10-build-sigungu-candidates.ts
 * 데이터: data/curated/sigungu-candidates.json (~680KB)
 *
 * "양천구" 검색 → 그 시·군·구의 모든 후보를 선거별로 묶어 반환.
 */

import index from '@/data/curated/sigungu-candidates.json';
import type { OfficeKind } from '@/types/domain';

export interface CandidateLite {
  /** 후보 상세 페이지가 게시된 경우에만 존재(비례대표는 개인 페이지가 없어 생략). */
  id?: string;
  name: string;
  party: string;
  ballotNumber: number;
  sggId: string;
  sggName: string;
  proportionalCount?: number;
}

interface IndexFile {
  version: number;
  generatedAt: string;
  sgId: string;
  sidoCount: number;
  sigunguCount: number;
  sigunguList: Array<{ sido: string; sigungu: string }>;
  sido: Record<string, Partial<Record<OfficeKind, CandidateLite[]>>>;
  sigungu: Record<string, Partial<Record<OfficeKind, CandidateLite[]>>>;
}

const IDX = index as unknown as IndexFile;

export interface SggGroup {
  sggName: string;
  sggId: string;
  candidates: CandidateLite[];
}

export interface RaceResult {
  officeKind: OfficeKind;
  label: string;
  /** 시·도 단위 선거인지 시·군·구 단위인지. */
  level: 'sido' | 'sigungu';
  /** 후보 총수. */
  candidateCount: number;
  /** 선거구 수 (시·도의원·구·시·군의원은 1 시·군·구에 여러 선거구). */
  sggCount: number;
  /** 선거구별 후보 그룹. */
  groups: SggGroup[];
}

const LABEL: Record<OfficeKind, string> = {
  metropolitan_governor: '시·도지사',
  education_superintendent: '교육감',
  basic_governor: '구·시·군의 장',
  metropolitan_member: '시·도의원 (지역구)',
  basic_member: '구·시·군의 의원 (지역구)',
  metropolitan_proportional: '광역의원 비례대표',
  basic_proportional: '기초의원 비례대표',
};

// 표시 순서
const SIDO_ORDER: OfficeKind[] = ['metropolitan_governor', 'education_superintendent'];
const SIGUNGU_ORDER: OfficeKind[] = ['basic_governor', 'metropolitan_member', 'basic_member'];
const PROPORTIONAL_ORDER: OfficeKind[] = ['metropolitan_proportional', 'basic_proportional'];

function groupBySgg(cands: CandidateLite[]): SggGroup[] {
  const map = new Map<string, SggGroup>();
  for (const c of cands) {
    let g = map.get(c.sggId);
    if (!g) {
      g = { sggName: c.sggName, sggId: c.sggId, candidates: [] };
      map.set(c.sggId, g);
    }
    g.candidates.push(c);
  }
  return Array.from(map.values()).sort((a, b) => a.sggName.localeCompare(b.sggName, 'ko'));
}

function buildRace(kind: OfficeKind, level: 'sido' | 'sigungu', cands: CandidateLite[] | undefined): RaceResult {
  const list = cands ?? [];
  const groups = groupBySgg(list);
  return {
    officeKind: kind,
    label: LABEL[kind],
    level,
    candidateCount: list.length,
    sggCount: groups.length,
    groups,
  };
}

export interface RegionResult {
  sido: string;
  sigungu: string;
  matched: boolean;
  races: RaceResult[];
}

/** 시·도명 + 시·군·구명 → 선거별 후보 묶음. */
export function getRegionCandidates(sidoName: string, sigunguName: string): RegionResult {
  const sidoBucket = IDX.sido[sidoName] ?? {};
  const sgBucket = IDX.sigungu[`${sidoName}|${sigunguName}`];
  const matched = sgBucket !== undefined;

  const races: RaceResult[] = [];
  for (const k of SIDO_ORDER) races.push(buildRace(k, 'sido', sidoBucket[k]));
  for (const k of SIGUNGU_ORDER) races.push(buildRace(k, 'sigungu', sgBucket?.[k]));
  for (const k of PROPORTIONAL_ORDER) {
    const src = k === 'metropolitan_proportional' ? sidoBucket[k] : sgBucket?.[k];
    races.push(buildRace(k, k === 'metropolitan_proportional' ? 'sido' : 'sigungu', src));
  }

  return { sido: sidoName, sigungu: sigunguName, matched, races };
}

/** 자치구 자동완성용 (시·도, 시·군·구) 목록. */
export function getSigunguList(): Array<{ sido: string; sigungu: string }> {
  return IDX.sigunguList;
}

export function sigunguCandidatesMetadata() {
  return {
    version: IDX.version,
    generatedAt: IDX.generatedAt,
    sgId: IDX.sgId,
    sidoCount: IDX.sidoCount,
    sigunguCount: IDX.sigunguCount,
  };
}
