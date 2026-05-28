/**
 * 룩업용 roster 슬림 요약 로더 (서버 전용).
 *
 * 빌더: scripts/ingest/08-build-roster-summary.ts
 * 데이터: data/curated/roster-summary.json (~680KB)
 *
 * 이 모듈은 API Route 등 Node.js 서버 컨텍스트에서만 import 하세요.
 * 클라이언트 번들에 들어가면 안 됩니다.
 */

import rosterSummary from '@/data/curated/roster-summary.json';
import type { OfficeKind } from '@/types/domain';

export interface RosterSigunguEntry {
  sidoCode: string;
  guCode: string;
  sidoName: string;
  guName: string;
  officeKindCounts: Partial<Record<OfficeKind, number>>;
  sggIds: Partial<Record<OfficeKind, string[]>>;
}

export interface RosterSidoEntry {
  sidoName: string;
  officeKindCounts: Partial<Record<OfficeKind, number>>;
  sggIds: Partial<Record<OfficeKind, string[]>>;
}

export interface RosterSggIndexEntry {
  officeKind: OfficeKind;
  sgTypecode: string;
  sidoCode: string;
  sidoName: string;
  guCode: string;
  guName: string;
  sggName: string;
  /** 이 선거구에 등록된 후보 수. */
  candidateCount: number;
}

/** UI/응답용 선거구 항목 (이름 + 후보 수). */
export interface SggListItem {
  sggId: string;
  sggName: string;
  candidateCount: number;
}

interface RosterSummaryFile {
  version: number;
  generatedAt: string;
  sgId: string;
  totalCandidates: number;
  sidoCount: number;
  sigunguCount: number;
  sggCount: number;
  byKey: Record<string, RosterSigunguEntry>;
  bySido: Record<string, RosterSidoEntry>;
  sggIndex: Record<string, RosterSggIndexEntry>;
}

const SUMMARY = rosterSummary as unknown as RosterSummaryFile;

/**
 * 시·도 단위 선거(시·도지사·교육감) 등록명 alias.
 *
 * 2026 지방선거에서 NEC는 광주광역시·전라남도의 광역단체장/교육감을
 * "전남광주통합특별시" 명의로 통합 등록했다. 카카오 주소는 "광주광역시"/"전라남도"로
 * 오므로, 시·도 단위 조회 시 통합 시·도명으로 매핑해야 한다.
 * (시·군·구 단위 선거 — 구청장/시도의원/구시군의원 — 은 원래 시·도명 그대로 유지.)
 */
const SIDO_LEVEL_ALIAS: Record<string, string> = {
  광주광역시: '전남광주통합특별시',
  전라남도: '전남광주통합특별시',
};

/** 시·도 단위 카운트/선거구 인덱스를 조회. sidoCode 4자리 또는 시·도명으로 lookup. */
export function getRosterSido(opts: { sidoCode?: string; sidoName?: string }): RosterSidoEntry | null {
  const { sidoCode, sidoName } = opts;
  if (sidoCode && SUMMARY.bySido[sidoCode]) return SUMMARY.bySido[sidoCode]!;
  if (sidoName) {
    const candidates = [sidoName, SIDO_LEVEL_ALIAS[sidoName]].filter(Boolean) as string[];
    for (const name of candidates) {
      for (const entry of Object.values(SUMMARY.bySido)) {
        if (entry.sidoName === name) return entry;
      }
    }
  }
  return null;
}

/** 시·군·구 단위 조회. (sidoCode+guCode) 또는 (sidoName+guName) 둘 다 지원. */
export function getRosterSigungu(opts: {
  sidoCode?: string;
  guCode?: string;
  sidoName?: string;
  sigunguName?: string;
}): RosterSigunguEntry | null {
  const { sidoCode, guCode, sidoName, sigunguName } = opts;
  if (sidoCode && guCode) {
    const key = `${sidoCode}|${guCode}`;
    if (SUMMARY.byKey[key]) return SUMMARY.byKey[key]!;
  }
  if (sidoName && sigunguName) {
    for (const entry of Object.values(SUMMARY.byKey)) {
      if (entry.sidoName === sidoName && entry.guName === sigunguName) return entry;
    }
  }
  return null;
}

export function getRosterSgg(sggId: string): RosterSggIndexEntry | null {
  return SUMMARY.sggIndex[sggId] ?? null;
}

/**
 * 구·시·군의 장(basic_governor) 조회 — 일반구 fallback 포함.
 *
 * 일반구(자치구가 아닌 행정구, 예: 성남시분당구·수원시영통구)는 NEC roster에서
 * 시장(basic_governor)이 형제 구 한 곳(예: 성남시수정구)에만 등록돼 있다.
 * 따라서 분당구 주소로 조회하면 직접 매칭이 0건 → 같은 "○○시" prefix의 형제 구에서 시장을 찾는다.
 */
export function getBasicGovernor(
  sidoName: string,
  sigunguName: string
): { sggIds: string[]; candidateCount: number; cityName: string } | null {
  const direct = getRosterSigungu({ sidoName, sigunguName });
  if (direct && (direct.officeKindCounts.basic_governor ?? 0) > 0) {
    return {
      sggIds: direct.sggIds.basic_governor ?? [],
      candidateCount: direct.officeKindCounts.basic_governor ?? 0,
      cityName: sigunguName,
    };
  }
  // 일반구 fallback: "성남시분당구" → 시 prefix "성남시"
  const m = sigunguName.match(/^(.+?시).+구$/);
  if (m) {
    const cityPrefix = m[1]!;
    for (const entry of Object.values(SUMMARY.byKey)) {
      if (
        entry.sidoName === sidoName &&
        entry.guName.startsWith(cityPrefix) &&
        (entry.officeKindCounts.basic_governor ?? 0) > 0
      ) {
        return {
          sggIds: entry.sggIds.basic_governor ?? [],
          candidateCount: entry.officeKindCounts.basic_governor ?? 0,
          cityName: cityPrefix,
        };
      }
    }
  }
  return null;
}

/** sggId 목록 → {sggId, sggName, candidateCount}[] (선거구명 가나다/번호 순 정렬). */
export function listSggItems(sggIds: ReadonlyArray<string>): SggListItem[] {
  return sggIds
    .map((id) => {
      const e = SUMMARY.sggIndex[id];
      return {
        sggId: id,
        sggName: e?.sggName ?? id,
        candidateCount: e?.candidateCount ?? 0,
      };
    })
    .sort((a, b) => a.sggName.localeCompare(b.sggName, 'ko'));
}

export function rosterSummaryMetadata() {
  return {
    version: SUMMARY.version,
    generatedAt: SUMMARY.generatedAt,
    sgId: SUMMARY.sgId,
    totalCandidates: SUMMARY.totalCandidates,
    sidoCount: SUMMARY.sidoCount,
    sigunguCount: SUMMARY.sigunguCount,
    sggCount: SUMMARY.sggCount,
  };
}
