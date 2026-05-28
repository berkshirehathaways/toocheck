// PRD §8 — 8 엔티티 + 보조 enum/타입.
// `Promise`는 JS 글로벌과 충돌하므로 `CandidatePromise`로 리네이밍 (결정 C3).

export type ElectionStatus = 'draft' | 'active' | 'archived';
export type ReviewStatus = 'pending' | 'reviewed' | 'needs_check';
export type CandidateStatus = 'active' | 'withdrawn' | 'unknown';
export type Severity = 'info' | 'check' | 'high_attention';
export type PromiseSourceType = 'nec_policy' | 'manual' | 'candidate_booklet';
export type PromiseCategory =
  | 'housing'
  | 'tax'
  | 'integrity'
  | 'transport'
  | 'welfare'
  | 'education'
  | 'environment'
  | 'safety'
  | 'other';

export type CheckCardType =
  | 'criminal_record'
  | 'tax_arrears'
  | 'asset'
  | 'military'
  | 'promise_specificity'
  | 'source_missing';

export type BadgeKind =
  | 'criminal_record_present'
  | 'tax_arrears_present'
  | 'asset_top_quintile'
  | 'military_disclosed'
  | 'promise_specificity_high'
  | 'data_pending';

/** PRD §8.1 */
export interface Election {
  id: string;
  name: string;
  electionType: 'local' | 'national_assembly' | 'presidential';
  electionDate: string; // ISO-8601 (YYYY-MM-DD)
  status: ElectionStatus;
  sourceUrl: string;
}

/** PRD §8.2 */
export interface District {
  id: string;
  electionId: string;
  name: string;
  region: string;
  positionTitle: string; // 예: 구청장
  description?: string;
}

/** PRD §8.3 */
export interface Candidate {
  id: string;
  districtId: string;
  electionId: string;
  ballotNumber: number; // 기호
  name: string;
  party: string; // 결정 B2: 가상 정당명 (`정당 A`) / 실데이터에선 실제 정당
  birthYear?: number;
  status: CandidateStatus;
  reviewStatus: ReviewStatus;
  reviewedBy: string; // 결정 C5: 'admin' 고정 (mock 단계)

  // ─── 보강 필드 (2026-05-28 실데이터 수집에서 도출, #13 §4-2) ───
  /** NEC 후보 식별자 (huboid). 재수집 매칭 키. */
  necId?: string;
  /** 한자 이름 (예: 劉燦鍾) — NEC 자료 한정. 위키와 불일치 시 NEC 우선. */
  nameHanja?: string;
  /** 생년월일 ISO YYYY-MM-DD (info.nec 페이지에서 정형 추출). */
  birthDate?: string;
  /** 성별. 내부 통계 용도 권장 (UI 기본 비노출). */
  gender?: 'M' | 'F';
  /** 직업 (NEC 등록자료 1줄). */
  occupation?: string;
  /** 학력 요약 1줄 (NEC 등록자료). */
  education?: string;
  /** 경력 리스트 (NEC 등록자료 2~5건). */
  career?: string[];
  /** 입후보 횟수 (NEC 등록자료). */
  electionRunCount?: number;
  /** 과거 출마 결과 (위키 출처 — CC BY-SA 4.0 표기 의무). */
  pastElections?: PastElectionResult[];

  // ─── #14 결정 보강 (2026-05-28 검증 사이클 종료) ───
  /** 영문명. 정부 공식 자료(서울시의회 등). 예: "Yoo Chan Jong" */
  nameEnglish?: string;
  /** 출신 고등학교. Wikidata 출생일 가드레일 통과 시만 채움. */
  highSchool?: string;
  /** 의정 활동(시의회·국회 통합). 시간순 표시. */
  councilTerms?: CouncilTerm[];

  // ─── 직책별 차별화 (2026-05-28 후속 — sgTypecode=6 누락 발견 시) ───
  /**
   * 직책 종류. UI/수집 규칙 분기 기준 (`OFFICE_PROFILES` 참조).
   * 교육감은 `partyAffiliated=false` → `party` 값 무시.
   * 비례대표는 `isProportional=true` → `ballotNumber`를 명부 순위로 해석.
   */
  officeKind?: OfficeKind;
  /** 비례대표 한정. NEC `hbjgiho`가 명부 순위와 동일하므로 같은 값 복제. */
  proportionalRank?: number;
  /** 교육감 한정 — 교원 자격, 학교/교육청 운영 경력. */
  educationCareer?: EducationCareerEntry[];
}

/**
 * 의정 활동 단위 (시의회·국회 통합).
 * 출처: 서울시의회 / Wikidata(가드레일 통과 시) / 국회 OpenAPI(향후).
 * 운영자가 §17 의심 단어 포함 시 needsReview=true 로 마크.
 */
export interface CouncilTerm {
  council: string;            // "서울특별시의회 9대" / "대한민국 국회 17대"
  position: string;           // 위원회 명·국회의원 본직 등
  start: string;              // ISO YYYY-MM-DD
  end: string;
  electoralDistrict?: string; // "종로구 제2선거구" / "강원 속초·고성·양양"
  sourceUrl: string;
  sourceLicense?: 'public_record' | 'CC0' | 'CC BY-SA 4.0';
  /** §17 의심 단어(예: "의혹") 포함 시 운영자 검수 후 표시. */
  needsReview?: boolean;
  /** 운영자 1차 검수 시 원본 명칭과 다른 축약 표시명. */
  displayLabel?: string;
}

/** 위키백과 등 외부 출처 인용 — `Candidate.pastElections[]` 에 사용. */
export interface PastElectionResult {
  year: number;
  electionName: string;        // 예: "제2회 전국동시지방선거"
  district: string;            // 예: "서울 종로 교남동"
  party: string;
  votes: number;
  votePct: number;             // 0~100
  rank: number;                // 1-based
  result: '당선' | '낙선';
  note?: string;
  sourceUrl?: string;          // 위키 URL
  sourceLicense?: 'CC BY-SA 4.0' | 'public_record';
}

/** PRD §8.4 — 모든 금액은 원 단위 (PRD §12.2) */
export interface CandidateDisclosure {
  candidateId: string;
  /** 재산 총액 (원) */
  assetTotal: number;
  /** 부동산·예금·증권·기타 비율 (합 100) — 결정 E11 인라인 막대 시각화용 */
  assetBreakdown: { realEstate: number; deposit: number; securities: number; other: number };
  /** 전과 기록 */
  criminalRecords: CriminalRecord[];
  /** 체납 기록 */
  taxArrears: TaxArrearsRecord[];
  /** 병역 원문 */
  militaryRecord: string;
  militarySummary?: string; // 결정 E15: 원문 + 한 줄 요약
  sourceUrls: string[];
  sourcePublishedAt: string; // ISO-8601
  sourceCheckedAt: string; // ISO-8601 (District 자료 기준일 산정 기준 - C6)

  // ─── 보강 필드 (2026-05-28 실데이터 수집에서 도출, #13 §4-2) ───
  /** 최근 5년간 납부액 (원) — PRD §9 명시 항목. info.nec 정형 추출 가능. */
  fiveYearTaxPaidKrw?: number;
  /** 최근 5년간 체납액 (원) — info.nec. taxArrears[]는 detail TIF 필요, 이건 요약 수치. */
  fiveYearTaxArrearsKrw?: number;
  /** 현재 체납액 (원) — info.nec. */
  currentTaxArrearsKrw?: number;
  /** 후보 사진 URL — NEC CDN deep-link (선거기간 동안 안전). */
  photoUrl?: string;
  /** 전과 건수 요약 (NEC info.nec). detail이 없을 때 표시용. criminalRecords.length와 일치하지 않을 수 있음 (TIF detail 부재 시). */
  criminalRecordCountSummary?: number;

  // ─── #14 결정 보강 (peti 재산 detail) ───
  /**
   * 공직자윤리위원회 정기 재산공개 정밀 분해. **현직자 한정**.
   * privacy 보호: 가족 구성원별 분리 비공개. 부동산 시·도 단위만.
   */
  petiBreakdown?: AssetCategoryBreakdown;
}

/**
 * peti.go.kr 재산 정밀 분해.
 * NEC assetTotal 요약을 8개 카테고리 + 전년 대비 증감으로 보완.
 * 출처: 정부공직자윤리위원회 공고.
 */
export interface AssetCategoryBreakdown {
  /** 등록기준일 ISO. 예: "2025-12-31" */
  asOf: string;
  /** 공개일자 ISO. 예: "2026-03-26" */
  disclosedAt: string;
  /** 공고 번호. 예: "정부공직자윤리위원회 공고 제2026-4호" */
  publicNoticeNo: string;
  /** 8개 카테고리별 합계 + 변동. */
  categories: AssetCategoryItem[];
  /**
   * 부동산 시·도 단위 + 건수만. (#14 결정 A: 시·도 + 건수만)
   * privacy 보호: 시·군·구·동·지번·면적은 저장하지 않음.
   */
  realEstateRegions?: Array<{ region: string; itemCount: number }>;
  /** 본인 단독 자산 합계 (원). */
  selfOnlyKrw: number;
  /**
   * 본인 + 가족 통합 합계 (원). (#14 결정 B: 본인 + 본인+가족 합계만)
   * 가족 구성원별 분리·명의는 비공개.
   */
  selfPlusFamilyKrw: number;
}

export interface AssetCategoryItem {
  name:
    | '토지'
    | '건물'
    | '예금'
    | '증권'
    | '채무'
    | '회원권'
    | '가상자산'
    | '자동차등'
    | '기타';
  totalKrw: number;
  itemCount: number;
  /**
   * 전년 대비 증감 (원). 양수 = 증가, 음수 = 감소.
   * (#14 결정 D: 단순 수치만, 색상·화살표 강조 비표시)
   */
  yearOverYearChangeKrw?: number;
}

export interface CriminalRecord {
  year: number;
  law: string; // 적용 법령
  outcome: string; // 결과 (벌금, 집행유예 등)
  amountKrw?: number;
}

export interface TaxArrearsRecord {
  year: number;
  amountKrw: number;
  status: 'outstanding' | 'paid'; // 미납 / 완납
  note?: string;
}

/** PRD §8.5 — `CandidatePromise` (결정 C3) */
export interface CandidatePromise {
  id: string;
  candidateId: string;
  orderNo: number;
  title: string;
  body: string;
  category: PromiseCategory;
  /** 5요소 기반 0~5 점수 (결정 D5) */
  specificityScore: number;
  source: PromiseSourceType;
  sourceUrl?: string;
  /** 운영자 작성 함께 확인 지점 (결정 D1, 운영자 우선) */
  crossCheckText?: string;

  // ─── 보강 필드 (2026-05-28 실데이터 수집에서 도출) ───
  /** NEC 표준 공약 4요소 자동 판정 결과. PRD §9.5와 1:1 대응. */
  necElements?: {
    goal: boolean;        // 목 표
    method: boolean;      // 이행방법
    period: boolean;      // 이행기간
    funding: boolean;     // 재원조달방안
    indicator: boolean;   // 지표 (NEC 공보엔 보통 명시 안 됨)
  };
}

/** PRD §8.6 */
export interface CandidateCheckCard {
  id: string;
  candidateId: string;
  type: CheckCardType;
  severity: Severity;
  title: string;
  body: string;
  sourceUrl?: string;
}

// ===== 보조 타입 (loader/화면 합성용) =====

export interface CompareRow {
  candidate: Candidate;
  disclosure: CandidateDisclosure | null;
  promiseCount: number;
  avgSpecificity: number; // 0~5, 소수 1자리 (결정 D7)
  assetRankInDistrict: number | null; // 1-based, needs_check는 null
  assetInTopQuintile: boolean; // 상위 20% (결정 D3·D6)
  badges: BadgeKind[];
  checkPriorityScore: number; // PRD §10, 0~160
  checkPriorityLabel: string; // 결정 D4
}

// ====================================================================
// 직책별 차별화 — 2026-05-28 #14 후속.
//
// 2026 지방선거 7개 선거 (NEC sgTypecode):
//   3  시·도지사               — 정당O, 공약의무O
//   11 교육감                   — **정당X (법률상 무관)**, 공약의무O
//   4  구·시·군의 장            — 정당O, 공약의무O
//   5  시·도의원(지역구)        — 정당O, 공약의무O
//   6  구·시·군의 의원(지역구)  — 정당O, **공약의무X** (NEC 5대공약 미게재)
//   8  광역의원 비례대표        — 정당O, 공약의무O (정당명부)
//   9  기초의원 비례대표        — 정당O, **공약의무X** (정당명부)
//
// "공약의무X"는 NEC policy.nec 5대공약 수집 불가 → UI에 "공약 미공개 (NEC 의무 비대상)" 안내.
// ====================================================================

export type OfficeKind =
  | 'metropolitan_governor'      // 시·도지사 (sgType=3)
  | 'education_superintendent'   // 교육감 (sgType=11) — 정당 비표시
  | 'basic_governor'             // 구·시·군의 장 (sgType=4)
  | 'metropolitan_member'        // 시·도의원 지역구 (sgType=5)
  | 'basic_member'               // 구·시·군의원 지역구 (sgType=6) — 5대공약 의무X
  | 'metropolitan_proportional'  // 광역의원 비례 (sgType=8) — 정당명부
  | 'basic_proportional';        // 기초의원 비례 (sgType=9) — 정당명부, 공약X

export interface OfficeProfile {
  kind: OfficeKind;
  /** NEC sgTypecode (policy.nec UI 라벨 기준). */
  sgTypecode: '3' | '11' | '4' | '5' | '6' | '8' | '9';
  /** 사람이 읽는 선거명. */
  label: string;
  /** policy.nec 5대공약 의무 등록. false면 UI에서 "공약 미공개" 안내. */
  requiresFiveCommitments: boolean;
  /** 정당공천 가능. false면 UI에서 정당 칸 비표시 (교육감 한정). */
  partyAffiliated: boolean;
  /** 비례대표 여부. true면 hbjgiho를 명부 순위로 해석. */
  isProportional: boolean;
  /** 강조 표시 필드 — 직책 특화 의사결정 기준. */
  emphasisFields: ReadonlyArray<
    'career' | 'councilTerms' | 'education' | 'educationCareer' | 'partyActivity'
  >;
}

export const OFFICE_PROFILES: Record<OfficeKind, OfficeProfile> = {
  metropolitan_governor: {
    kind: 'metropolitan_governor',
    sgTypecode: '3',
    label: '시·도지사',
    requiresFiveCommitments: true,
    partyAffiliated: true,
    isProportional: false,
    emphasisFields: ['career', 'councilTerms'],
  },
  education_superintendent: {
    kind: 'education_superintendent',
    sgTypecode: '11',
    label: '교육감',
    requiresFiveCommitments: true,
    partyAffiliated: false,
    isProportional: false,
    emphasisFields: ['education', 'educationCareer'],
  },
  basic_governor: {
    kind: 'basic_governor',
    sgTypecode: '4',
    label: '구·시·군의 장',
    requiresFiveCommitments: true,
    partyAffiliated: true,
    isProportional: false,
    emphasisFields: ['career', 'councilTerms'],
  },
  metropolitan_member: {
    kind: 'metropolitan_member',
    sgTypecode: '5',
    label: '시·도의원 (지역구)',
    requiresFiveCommitments: true,
    partyAffiliated: true,
    isProportional: false,
    emphasisFields: ['councilTerms', 'career'],
  },
  basic_member: {
    kind: 'basic_member',
    sgTypecode: '6',
    label: '구·시·군의 의원 (지역구)',
    requiresFiveCommitments: false,
    partyAffiliated: true,
    isProportional: false,
    emphasisFields: ['career'],
  },
  metropolitan_proportional: {
    kind: 'metropolitan_proportional',
    sgTypecode: '8',
    label: '광역의원 비례대표',
    requiresFiveCommitments: true,
    partyAffiliated: true,
    isProportional: true,
    emphasisFields: ['partyActivity', 'career'],
  },
  basic_proportional: {
    kind: 'basic_proportional',
    sgTypecode: '9',
    label: '기초의원 비례대표',
    requiresFiveCommitments: false,
    partyAffiliated: true,
    isProportional: true,
    emphasisFields: ['partyActivity'],
  },
};

/** sgTypecode → OfficeKind 역인덱스. */
export const SGTYPECODE_TO_OFFICE_KIND: Record<string, OfficeKind> = Object.fromEntries(
  Object.values(OFFICE_PROFILES).map((p) => [p.sgTypecode, p.kind])
);

/** 교육감 특화 — 교원 자격·학교 운영 경력. */
export interface EducationCareerEntry {
  role: string;          // "교원" / "교장" / "교육감 위원회 ..."
  organization: string;  // 학교명·교육청명
  start: string;         // ISO YYYY-MM-DD
  end?: string;
  sourceUrl?: string;
}
