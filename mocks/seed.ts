// mock 시드 — 결정 B1·B2·C1·C2·C5·C7 반영
// District 1개 · 후보 4명 · 시나리오 4종 (무난 / 전과 / 체납·부동산상위 / needs_check)
// 모든 sourceUrl은 https://example.test/* placeholder (실데이터 단계에 교체).

import type {
  Candidate,
  CandidateCheckCard,
  CandidateDisclosure,
  CandidatePromise,
  District,
  Election,
} from '@/types/domain';

export const elections: Election[] = [
  {
    id: 'election_2026_local',
    name: '2026 지방선거',
    electionType: 'local',
    electionDate: '2026-06-03',
    status: 'active',
    sourceUrl: 'https://example.test/elections/2026-local',
  },
];

export const districts: District[] = [
  {
    id: 'district_sample_ga',
    electionId: 'election_2026_local',
    name: '샘플 시 가나구청장',
    region: '샘플 시',
    positionTitle: '구청장',
    description: '본 지역 및 후보 정보는 시연용 가상 데이터입니다.',
  },
];

const REVIEWED_BY = 'admin';

export const candidates: Candidate[] = [
  {
    id: 'cand_001',
    districtId: 'district_sample_ga',
    electionId: 'election_2026_local',
    ballotNumber: 1,
    name: '가후보',
    party: '정당 A',
    birthYear: 1968,
    status: 'active',
    reviewStatus: 'reviewed',
    reviewedBy: REVIEWED_BY,
  },
  {
    id: 'cand_002',
    districtId: 'district_sample_ga',
    electionId: 'election_2026_local',
    ballotNumber: 2,
    name: '나후보',
    party: '정당 B',
    birthYear: 1972,
    status: 'active',
    reviewStatus: 'reviewed',
    reviewedBy: REVIEWED_BY,
  },
  {
    id: 'cand_003',
    districtId: 'district_sample_ga',
    electionId: 'election_2026_local',
    ballotNumber: 3,
    name: '다후보',
    party: '정당 C',
    birthYear: 1965,
    status: 'active',
    reviewStatus: 'reviewed',
    reviewedBy: REVIEWED_BY,
  },
  {
    id: 'cand_004',
    districtId: 'district_sample_ga',
    electionId: 'election_2026_local',
    ballotNumber: 4,
    name: '라후보',
    party: '무소속',
    birthYear: 1980,
    status: 'active',
    reviewStatus: 'needs_check', // 결정 E16: 표시되되 '자료 확인 중'
    reviewedBy: REVIEWED_BY,
  },
];

const SOURCE_PUBLISHED = '2026-05-15';
const SOURCE_CHECKED_BASE = '2026-05-20';

export const disclosures: CandidateDisclosure[] = [
  // 1번 — 무난한 후보 (전과·체납 없음, 자산 하위, 공약 구체성 높음)
  {
    candidateId: 'cand_001',
    assetTotal: 320_000_000,
    assetBreakdown: { realEstate: 55, deposit: 30, securities: 10, other: 5 },
    criminalRecords: [],
    taxArrears: [],
    militaryRecord: '육군 병장 만기 전역 (1987.03~1989.06)',
    militarySummary: '육군 병장 만기 전역',
    sourceUrls: ['https://example.test/disclosure/cand_001'],
    sourcePublishedAt: SOURCE_PUBLISHED,
    sourceCheckedAt: '2026-05-22',
  },
  // 2번 — 전과 1건 (도로교통법 위반·벌금), 자산 중위
  {
    candidateId: 'cand_002',
    assetTotal: 720_000_000,
    assetBreakdown: { realEstate: 60, deposit: 25, securities: 10, other: 5 },
    criminalRecords: [
      {
        year: 2014,
        law: '도로교통법 위반',
        outcome: '벌금 100만원',
        amountKrw: 1_000_000,
      },
    ],
    taxArrears: [],
    militaryRecord: '육군 병장 만기 전역 (1991.04~1993.07)',
    militarySummary: '육군 병장 만기 전역',
    sourceUrls: ['https://example.test/disclosure/cand_002'],
    sourcePublishedAt: SOURCE_PUBLISHED,
    sourceCheckedAt: SOURCE_CHECKED_BASE,
  },
  // 3번 — 체납 1건(완납), 자산 상위(부동산 비중 큼), 공약 구체성 낮음
  {
    candidateId: 'cand_003',
    assetTotal: 2_200_000_000,
    assetBreakdown: { realEstate: 78, deposit: 12, securities: 8, other: 2 },
    criminalRecords: [],
    taxArrears: [
      {
        year: 2019,
        amountKrw: 12_000_000,
        status: 'paid',
        note: '2019년 종합소득세 체납 후 완납',
      },
    ],
    militaryRecord: '면제 (수형, 1985)',
    militarySummary: '면제 (수형)',
    sourceUrls: ['https://example.test/disclosure/cand_003'],
    sourcePublishedAt: SOURCE_PUBLISHED,
    sourceCheckedAt: '2026-05-18',
  },
  // 4번 — needs_check: disclosure 없음 (시연용)
];

export const promises: CandidatePromise[] = [
  // ===== 1번 가후보 (무난, 공약 구체성 높음) =====
  {
    id: 'pr_001_1',
    candidateId: 'cand_001',
    orderNo: 1,
    title: '가나구청 청년 임대주택 1,200세대 5년 내 공급',
    body: '구비·국비 약 1,800억 원을 투입해 2026~2031년 사이 가나구 내 청년·신혼부부 대상 공공임대 1,200세대를 공급한다. 분기별 분양 일정과 지표 공개.',
    category: 'housing',
    specificityScore: 5,
    source: 'manual',
    sourceUrl: 'https://example.test/promise/cand_001/1',
  },
  {
    id: 'pr_001_2',
    candidateId: 'cand_001',
    orderNo: 2,
    title: '구청 주관 도로 보행 안전 사업 12개소 2027년까지 완료',
    body: '교통사고 발생 빈도 상위 12개소를 선정해 횡단보도 LED·과속방지턱·보행자 신호 개선. 사업비 약 80억 원, 매년 4개소 단위 완료.',
    category: 'transport',
    specificityScore: 5,
    source: 'manual',
  },
  {
    id: 'pr_001_3',
    candidateId: 'cand_001',
    orderNo: 3,
    title: '돌봄 공백 가구 대상 야간 돌봄 거점 4곳 신설',
    body: '맞벌이·한부모 가정의 야간(18~22시) 돌봄 공백 해소를 위해 권역별 4곳을 신설하고, 정원·운영시간·이용료를 표준화.',
    category: 'welfare',
    specificityScore: 4,
    source: 'manual',
  },
  {
    id: 'pr_001_4',
    candidateId: 'cand_001',
    orderNo: 4,
    title: '초등 방과후 디지털 리터러시 의무 이수 도입',
    body: '관내 초등학교 전 학년 대상 방과후 디지털 리터러시 16차시 의무 이수. 강사 인건비·교재비를 구비로 지원.',
    category: 'education',
    specificityScore: 3,
    source: 'manual',
  },
  {
    id: 'pr_001_5',
    candidateId: 'cand_001',
    orderNo: 5,
    title: '미세먼지 저감 도시숲 5개소 조성',
    body: '미세먼지 농도 상위 권역을 우선 선정해 도시숲 5개소(2027년까지) 조성. 예산 60억 원, 지표는 PM2.5 연평균.',
    category: 'environment',
    specificityScore: 4,
    source: 'manual',
  },
  // ===== 2번 나후보 (전과, 청렴 공약 일부, 공약 구체성 보통) =====
  {
    id: 'pr_002_1',
    candidateId: 'cand_002',
    orderNo: 1,
    title: '구청 산하 사업 입찰 공개 강화',
    body: '구청 발주 사업의 입찰 공고·결과·낙찰가를 한 페이지에서 검색·다운로드 가능하도록 공개. 시행은 2026년 하반기.',
    category: 'integrity',
    specificityScore: 3,
    source: 'manual',
    crossCheckText:
      '입찰 공개 범위와 비식별화 기준은 후속 조례로 정의되어야 합니다. 후보의 공약 본문에는 구체적 항목 목록이 포함되어 있지 않으므로, 공개 일정과 함께 적용 범위를 확인할 필요가 있습니다.',
  },
  {
    id: 'pr_002_2',
    candidateId: 'cand_002',
    orderNo: 2,
    title: '주민참여예산 비중 5% 확대',
    body: '현행 약 1% 수준의 주민참여예산을 5%로 확대 운영. 단계적 인상 일정 미명시.',
    category: 'integrity',
    specificityScore: 2,
    source: 'manual',
  },
  {
    id: 'pr_002_3',
    candidateId: 'cand_002',
    orderNo: 3,
    title: '구민 교통비 환급 카드 도입',
    body: '월 일정액 이상 대중교통 이용 구민 대상 환급. 환급률·재원·지속가능성 검토는 도입 첫해에 시행.',
    category: 'transport',
    specificityScore: 2,
    source: 'manual',
  },
  {
    id: 'pr_002_4',
    candidateId: 'cand_002',
    orderNo: 4,
    title: '청년 1인 가구 대상 안심귀가 동행 서비스 확대',
    body: '저녁 시간대 1인 가구 대상 동행 서비스를 권역 단위로 확대. 운영 주체와 인력 규모 미명시.',
    category: 'safety',
    specificityScore: 2,
    source: 'manual',
  },
  {
    id: 'pr_002_5',
    candidateId: 'cand_002',
    orderNo: 5,
    title: '소상공인 대출 이자 지원 사업',
    body: '관내 소상공인 대상 신규 대출의 이자 일부를 구비로 지원. 지원 한도·자격 요건 검토 중.',
    category: 'welfare',
    specificityScore: 2,
    source: 'manual',
  },
  {
    id: 'pr_002_6',
    candidateId: 'cand_002',
    orderNo: 6,
    title: '구립 어린이집 운영시간 단계적 확대',
    body: '맞벌이 가구의 보육 공백 완화를 위해 운영시간을 단계적으로 확대.',
    category: 'welfare',
    specificityScore: 1,
    source: 'manual',
  },
  // ===== 3번 다후보 (체납·부동산 상위, 공약 구체성 낮음, 주거·조세 공약 포함) =====
  {
    id: 'pr_003_1',
    candidateId: 'cand_003',
    orderNo: 1,
    title: '재건축·재개발 인허가 절차 단축',
    body: '관내 노후 단지 재건축·재개발 인허가 평균 처리 기간을 단축. 단축 폭과 적용 범위는 협의 중.',
    category: 'housing',
    specificityScore: 1,
    source: 'manual',
    crossCheckText:
      '본 후보는 부동산 비중이 지역 내 상위 분위에 해당하는 공개 자료가 있습니다. 주거 분야 공약의 영향 범위(임대·매매·재건축 등)를 함께 살펴보는 것이 좋습니다.',
  },
  {
    id: 'pr_003_2',
    candidateId: 'cand_003',
    orderNo: 2,
    title: '지방세 감면 대상 확대 추진',
    body: '지방세 감면 대상을 일부 확대. 세부 항목·재원 마련 방안은 조례 개정 시 검토.',
    category: 'tax',
    specificityScore: 1,
    source: 'manual',
    crossCheckText:
      '본 후보는 과거 종합소득세 체납 후 완납한 공개 자료가 있습니다. 조세 공약의 적용 항목과 재원 마련 방안을 함께 살펴볼 것을 권장합니다.',
  },
  {
    id: 'pr_003_3',
    candidateId: 'cand_003',
    orderNo: 3,
    title: '주민 편의시설 신설',
    body: '주민센터·체육시설·도서관 등 권역별 편의시설 신설을 단계적으로 추진.',
    category: 'welfare',
    specificityScore: 0,
    source: 'manual',
  },
  {
    id: 'pr_003_4',
    candidateId: 'cand_003',
    orderNo: 4,
    title: '구청 행정 효율화',
    body: '디지털 기반 행정 절차 효율화로 처리 속도를 개선.',
    category: 'other',
    specificityScore: 1,
    source: 'manual',
  },
  {
    id: 'pr_003_5',
    candidateId: 'cand_003',
    orderNo: 5,
    title: '도시 안전 카메라 점진적 확충',
    body: '범죄·재난 대비를 위해 안전 카메라를 점진적으로 확충.',
    category: 'safety',
    specificityScore: 1,
    source: 'manual',
  },
];

export const checkCards: CandidateCheckCard[] = [
  // 1번 가후보 — 정보형 중심
  {
    id: 'cc_001_1',
    candidateId: 'cand_001',
    type: 'criminal_record',
    severity: 'info',
    title: '공개된 전과 기록 없음',
    body: '공개된 공식 자료에 기재된 전과 기록이 없습니다.',
  },
  {
    id: 'cc_001_2',
    candidateId: 'cand_001',
    type: 'tax_arrears',
    severity: 'info',
    title: '공개된 체납 기록 없음',
    body: '공개된 공식 자료에 기재된 체납 기록이 없습니다.',
  },
  {
    id: 'cc_001_3',
    candidateId: 'cand_001',
    type: 'promise_specificity',
    severity: 'info',
    title: '공약 구체성 높음',
    body: '본 후보 공약 5건의 평균 구체성 점수가 4점 이상으로, 5요소(목표·예산·기간·주체·지표)를 대부분 명시합니다.',
  },
  // 2번 나후보 — 전과 공개 + 청렴 공약
  {
    id: 'cc_002_1',
    candidateId: 'cand_002',
    type: 'criminal_record',
    severity: 'check',
    title: '공개된 전과 1건 (도로교통법 위반)',
    body: '2014년 도로교통법 위반으로 벌금 100만원 처분 기록이 공개되어 있습니다. 본 정보는 공개 자료를 그대로 인용한 것입니다.',
    sourceUrl: 'https://example.test/disclosure/cand_002#criminal',
  },
  {
    id: 'cc_002_2',
    candidateId: 'cand_002',
    type: 'promise_specificity',
    severity: 'check',
    title: '공약 구체성 보통',
    body: '본 후보 공약 평균 구체성 점수가 2점대로, 예산·기간·지표 등 일부 항목이 누락된 공약이 있습니다.',
  },
  {
    id: 'cc_002_3',
    candidateId: 'cand_002',
    type: 'tax_arrears',
    severity: 'info',
    title: '공개된 체납 기록 없음',
    body: '공개된 공식 자료에 기재된 체납 기록이 없습니다.',
  },
  // 3번 다후보 — 체납 + 부동산 상위 + 공약 구체성 낮음
  {
    id: 'cc_003_1',
    candidateId: 'cand_003',
    type: 'tax_arrears',
    severity: 'check',
    title: '공개된 체납 기록 1건 (완납)',
    body: '2019년 종합소득세 1,200만원 체납 후 완납한 공개 자료가 있습니다. 본 정보는 공개 자료를 그대로 인용한 것입니다.',
    sourceUrl: 'https://example.test/disclosure/cand_003#tax',
  },
  {
    id: 'cc_003_2',
    candidateId: 'cand_003',
    type: 'asset',
    severity: 'check',
    title: '재산 분야 부동산 비중 상위',
    body: '지역 내 후보 중 부동산 비중 상위 분위에 해당합니다. 자산 구성은 공개 자료 기준입니다.',
    sourceUrl: 'https://example.test/disclosure/cand_003#asset',
  },
  {
    id: 'cc_003_3',
    candidateId: 'cand_003',
    type: 'promise_specificity',
    severity: 'high_attention',
    title: '공약 구체성 낮음',
    body: '본 후보 공약 평균 구체성 점수가 1점 미만으로, 예산·기간·주체·지표 항목이 대부분 명시되지 않습니다.',
  },
  // 4번 라후보 — needs_check
  {
    id: 'cc_004_1',
    candidateId: 'cand_004',
    type: 'source_missing',
    severity: 'info',
    title: '자료 확인 중',
    body: '자료 입력 전입니다. 원문 확인 후 반영됩니다.',
  },
];
