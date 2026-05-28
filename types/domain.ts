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
