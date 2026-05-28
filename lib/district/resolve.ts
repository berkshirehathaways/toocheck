/**
 * 주소 → 지역구 통합 룩업 (서버 전용).
 *
 * 입력: 카카오 우편번호 응답에서 추출한 시도명·시군구명·법정동코드·우편번호 등
 * 출력: 5종 선거(시·도지사, 교육감, 구·시·군의 장, 시·도의원, 구·시·군의 의원)에 대해
 *   - 시드 데이터(`mocks/seed.ts`)에 있는 District 매핑 (있으면 detail 페이지로 이동 가능)
 *   - NEC roster 기준 후보 수 + 선거구 목록 (전국 전 시군구 커버)
 *   - 매칭 정밀도 (dong / sigungu_unique / sigungu / sido / none)
 *
 * 매칭 정밀도 등급:
 *   - sido           : 시·도지사·교육감 (시·도 1:1, 전국 결정적)
 *   - sigungu        : 구·시·군의 장 (시·군·구 1:1, 전국 결정적) — 단, 광역/기초의원이
 *                      한 시·군·구에 여러 선거구일 때의 fallback 등급으로도 사용
 *   - sigungu_unique : 광역/기초의원이 한 시·군·구에 선거구가 1개뿐 → roster만으로 정밀 확정
 *   - dong           : 조례 기반 행정동 매핑으로 광역/기초의원 선거구 1곳 확정 (assembly-district-map)
 *   - none           : 식별 실패
 */

import type { OfficeKind } from '@/types/domain';
import { getSigunguEntry, getSidoEntry } from './sigungu-map';
import {
  getRosterSido,
  getRosterSigungu,
  getBasicGovernor,
  listSggItems,
  type RosterSidoEntry,
  type RosterSigunguEntry,
  type SggListItem,
} from './roster-summary';
import { resolveAssemblySggIds, isCovered } from './assembly-district-map';
import { preferHname } from './dong-codes';

export interface DistrictLookupInput {
  /** 우편번호 (선택, 디버그·로깅용) */
  zonecode?: string;
  /** 시도명 — 카카오 sido. 예: "서울특별시" */
  sidoName: string;
  /** 시군구명 — 카카오 sigungu. 예: "종로구" */
  sigunguName?: string;
  /** 시군구 5자리 코드(행안부) — 카카오 sigunguCode. 예: "11110" */
  sigunguCode?: string;
  /** 법정동코드 10자리 — 카카오 bcode. 예: "1111010100" */
  bcode?: string;
  /** 법정동명 — 카카오 bname. 예: "청운동" */
  bname?: string;
  /** 행정동명 — 카카오 hname. 예: "청운효자동" (없으면 bcode로 보강) */
  hname?: string;
}

export type Precision = 'sido' | 'sigungu_unique' | 'sigungu' | 'dong' | 'none';

export interface OfficeLookupResult {
  officeKind: OfficeKind;
  /** 사람이 읽는 라벨, 예: "구·시·군의 장" */
  label: string;
  /** 시드 데이터에 매핑된 District.id (UI 상세 페이지로 이동 가능). 없으면 null. */
  districtId: string | null;
  /** NEC roster 기준 이 위치의 후보 수 (확정 선거구 또는 시·군·구 합계). */
  candidateCount: number;
  /** 매칭이 일어난 정밀도. */
  precision: Precision;
  /** 확정된 선거구 sggId 목록 (정밀 확정 시 1개, 복수 fallback 시 여러 개). */
  sggIds: string[];
  /** 선거구 목록 (이름 + 후보 수). 정밀 확정 시 1개, fallback 시 후보가 있는 모든 선거구. */
  sggList: SggListItem[];
  /** 확정 매칭 여부 — true면 단일 선거구로 좁혀짐(dong 또는 sigungu_unique). */
  resolved: boolean;
  /** 사용자에게 보여줄 짧은 안내 문구. */
  message: string;
}

export interface DistrictLookupResponse {
  /** 룩업한 입력 echo (디버그). */
  input: DistrictLookupInput;
  /** 매칭 시도된 시·도. */
  sido: {
    name: string;
    matched: boolean;
  };
  /** 매칭 시도된 시·군·구. */
  sigungu: {
    name: string | null;
    matched: boolean;
    sigunguCode?: string;
  };
  /** 적용된 행정동명 (kakao hname 또는 bcode 보강). */
  resolvedHname: string | null;
  /** 5종 선거의 결과. */
  offices: OfficeLookupResult[];
  /** 메타데이터. */
  meta: {
    coverageNote: string;
    /** 동 단위 조례 정밀 매핑이 적용 가능한 시·도인지. */
    dongPrecisionAvailable: boolean;
  };
}

const OFFICE_LABEL: Record<OfficeKind, string> = {
  metropolitan_governor: '시·도지사',
  education_superintendent: '교육감',
  basic_governor: '구·시·군의 장',
  metropolitan_member: '시·도의원 (지역구)',
  basic_member: '구·시·군의 의원 (지역구)',
  metropolitan_proportional: '광역의원 비례대표',
  basic_proportional: '기초의원 비례대표',
};

function seedDistrictFor(
  kind: OfficeKind,
  sidoName: string,
  sigunguName: string | undefined
): string | null {
  if (sigunguName) {
    const s = getSigunguEntry(sidoName, sigunguName);
    const hit = s?.districtIds.find((d) => d.officeKind === kind);
    if (hit) return hit.districtId;
  }
  const sd = getSidoEntry(sidoName);
  const hit2 = sd?.districtIds.find((d) => d.officeKind === kind);
  return hit2?.districtId ?? null;
}

function buildSidoResult(
  kind: OfficeKind,
  sidoName: string,
  sidoEntry: RosterSidoEntry | null
): OfficeLookupResult {
  const count = sidoEntry?.officeKindCounts[kind] ?? 0;
  const sggIds = sidoEntry?.sggIds[kind] ?? [];
  const districtId = seedDistrictFor(kind, sidoName, undefined);
  return {
    officeKind: kind,
    label: OFFICE_LABEL[kind],
    districtId,
    candidateCount: count,
    precision: sidoEntry ? 'sido' : 'none',
    sggIds: [...sggIds],
    sggList: listSggItems(sggIds),
    resolved: sidoEntry !== null,
    message: sidoEntry
      ? districtId
        ? `${sidoName} 후보 자료 보기`
        : `${sidoName} 후보 ${count}명 — NEC 등록 자료 기준 (상세 자료 보강 중)`
      : `${sidoName} 자료를 찾지 못했습니다.`,
  };
}

function buildBasicGovernorResult(
  sidoName: string,
  sigunguName: string | undefined
): OfficeLookupResult {
  const kind: OfficeKind = 'basic_governor';
  if (!sidoName || !sigunguName) {
    return {
      officeKind: kind,
      label: OFFICE_LABEL[kind],
      districtId: null,
      candidateCount: 0,
      precision: 'none',
      sggIds: [],
      sggList: [],
      resolved: false,
      message: '시·군·구를 식별하지 못했습니다.',
    };
  }
  // 일반구(성남시분당구 등)는 시장이 형제 구에 등록 → getBasicGovernor가 fallback 처리
  const bg = getBasicGovernor(sidoName, sigunguName);
  if (!bg) {
    return {
      officeKind: kind,
      label: OFFICE_LABEL[kind],
      districtId: null,
      candidateCount: 0,
      precision: 'none',
      sggIds: [],
      sggList: [],
      resolved: false,
      message: `${sigunguName} ${OFFICE_LABEL[kind]} 자료를 찾지 못했습니다.`,
    };
  }
  const districtId = seedDistrictFor(kind, sidoName, sigunguName);
  const label = bg.cityName !== sigunguName ? `${bg.cityName}장` : OFFICE_LABEL[kind];
  return {
    officeKind: kind,
    label: OFFICE_LABEL[kind],
    districtId,
    candidateCount: bg.candidateCount,
    precision: 'sigungu',
    sggIds: [...bg.sggIds],
    sggList: listSggItems(bg.sggIds),
    resolved: true, // 구·시·군의 장은 시·군·구(또는 시) 1:1이라 항상 확정
    message: districtId
      ? `${label} 자료 보기`
      : `${label} 후보 ${bg.candidateCount}명 — 자료 보강 중`,
  };
}

/** 광역의원/기초의원 — 단일 선거구면 자동 확정, 복수면 itemized fallback. */
function buildMemberResult(
  kind: 'metropolitan_member' | 'basic_member',
  sidoName: string,
  sigunguName: string | undefined,
  sigunguEntry: RosterSigunguEntry | null
): OfficeLookupResult {
  if (!sigunguEntry || !sigunguName) {
    return {
      officeKind: kind,
      label: OFFICE_LABEL[kind],
      districtId: null,
      candidateCount: 0,
      precision: 'none',
      sggIds: [],
      sggList: [],
      resolved: false,
      message: '시·군·구를 식별하지 못했습니다.',
    };
  }
  const sggIds = sigunguEntry.sggIds[kind] ?? [];
  const sggList = listSggItems(sggIds);
  const totalCount = sigunguEntry.officeKindCounts[kind] ?? 0;

  // G1: 시·군·구에 선거구가 1개뿐 → roster만으로 정밀 확정 (조례 불필요)
  if (sggList.length === 1) {
    const only = sggList[0]!;
    return {
      officeKind: kind,
      label: OFFICE_LABEL[kind],
      districtId: null,
      candidateCount: only.candidateCount,
      precision: 'sigungu_unique',
      sggIds: [only.sggId],
      sggList,
      resolved: true,
      message: `${only.sggName} 후보 ${only.candidateCount}명`,
    };
  }

  // G2: 복수 선거구 → itemized fallback (각 선거구를 그대로 노출)
  return {
    officeKind: kind,
    label: OFFICE_LABEL[kind],
    districtId: null,
    candidateCount: totalCount,
    precision: 'sigungu',
    sggIds: [...sggIds],
    sggList,
    resolved: false,
    message:
      sggList.length > 1
        ? `${sigunguName} 내 ${OFFICE_LABEL[kind]} 선거구 ${sggList.length}곳 (후보 ${totalCount}명) — 거주 동에 따라 결정`
        : `${sigunguName} ${OFFICE_LABEL[kind]} 후보 ${totalCount}명`,
  };
}

export function resolveDistricts(input: DistrictLookupInput): DistrictLookupResponse {
  const sidoName = input.sidoName?.trim() ?? '';
  const sigunguName = input.sigunguName?.trim() || undefined;

  const sidoEntry = sidoName ? getRosterSido({ sidoName }) : null;
  const sigunguEntry =
    sidoName && sigunguName ? getRosterSigungu({ sidoName, sigunguName }) : null;

  const offices: OfficeLookupResult[] = [
    buildSidoResult('metropolitan_governor', sidoName, sidoEntry),
    buildSidoResult('education_superintendent', sidoName, sidoEntry),
    buildBasicGovernorResult(sidoName, sigunguName),
    buildMemberResult('metropolitan_member', sidoName, sigunguName, sigunguEntry),
    buildMemberResult('basic_member', sidoName, sigunguName, sigunguEntry),
  ];

  // 행정동명 보강: kakao 응답에 hname이 없으면 bcode로 행정동명을 보강.
  const effectiveHname = preferHname({ bcode: input.bcode, kakaoHname: input.hname });

  // 조례 기반 동 단위 정밀 매칭 — metropolitan_member / basic_member 를 덮어쓰기 (최우선)
  if (input.bcode || (sidoName && sigunguName && (input.bname || effectiveHname))) {
    const refined = resolveAssemblySggIds({
      bcode: input.bcode,
      sidoName,
      sigunguName,
      bname: input.bname,
      hname: effectiveHname ?? undefined,
    });
    if (refined) {
      for (const office of offices) {
        if (office.officeKind === 'metropolitan_member' && refined.metropolitanSggId) {
          const cnt = refined.metropolitanCandidateCount ?? office.candidateCount;
          office.sggIds = [refined.metropolitanSggId];
          office.sggList = [
            {
              sggId: refined.metropolitanSggId,
              sggName: refined.metropolitanSggName ?? refined.metropolitanSggId,
              candidateCount: cnt,
            },
          ];
          office.precision = 'dong';
          office.resolved = true;
          office.candidateCount = cnt;
          office.message = `${refined.metropolitanSggName ?? OFFICE_LABEL[office.officeKind]} 후보 ${cnt}명 (동 단위 정밀 매칭)`;
        }
        if (office.officeKind === 'basic_member' && refined.basicSggId) {
          const cnt = refined.basicCandidateCount ?? office.candidateCount;
          office.sggIds = [refined.basicSggId];
          office.sggList = [
            {
              sggId: refined.basicSggId,
              sggName: refined.basicSggName ?? refined.basicSggId,
              candidateCount: cnt,
            },
          ];
          office.precision = 'dong';
          office.resolved = true;
          office.candidateCount = cnt;
          office.message = `${refined.basicSggName ?? OFFICE_LABEL[office.officeKind]} 후보 ${cnt}명 (동 단위 정밀 매칭)`;
        }
      }
    }
  }

  const coverageParts: string[] = [];
  if (offices.some((o) => o.precision === 'dong')) coverageParts.push('동 단위 정밀');
  if (offices.some((o) => o.precision === 'sigungu_unique')) coverageParts.push('단일 선거구 확정');
  if (offices.some((o) => o.precision === 'sigungu' && !o.resolved && o.candidateCount > 0))
    coverageParts.push('복수 선거구 안내');
  if (offices.some((o) => o.precision === 'sido' && o.candidateCount > 0))
    coverageParts.push('시·도 단위');

  return {
    input,
    sido: { name: sidoName, matched: sidoEntry !== null },
    sigungu: {
      name: sigunguName ?? null,
      matched: sigunguEntry !== null,
      sigunguCode: input.sigunguCode,
    },
    resolvedHname: effectiveHname ?? null,
    offices,
    meta: {
      coverageNote:
        coverageParts.length === 0
          ? '해당 지역 자료를 아직 찾지 못했습니다.'
          : coverageParts.join(' · '),
      dongPrecisionAvailable: sidoName ? isCovered(sidoName, sigunguName) : false,
    },
  };
}
