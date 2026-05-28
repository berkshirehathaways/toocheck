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
  // ─── 실데이터 (2026-05-28 수집, NEC info.nec.go.kr / policy.nec.go.kr 출처) ───
  {
    id: 'district_seoul_jongno',
    electionId: 'election_2026_local',
    name: '서울특별시 종로구청장',
    region: '서울특별시',
    positionTitle: '구청장',
    description: '제9회 전국동시지방선거 구·시·군의 장선거. NEC 공개자료 기준.',
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
  // ─── 실데이터: 서울 종로구청장 (2026-05-28 수집) ───
  {
    id: 'cand_jongno_1',
    districtId: 'district_seoul_jongno',
    electionId: 'election_2026_local',
    ballotNumber: 1,
    name: '유찬종',
    nameHanja: '劉燦鍾',
    party: '더불어민주당',
    birthYear: 1959,
    birthDate: '1959-11-20',
    gender: 'M',
    occupation: '정당인',
    education: '연세대학교 경법대학 법학 졸업',
    career: [
      '(전)종로구청장 후보',
      '(전)제20-21대 이재명 대통령후보 종로구 공동상임 선대위원장',
    ],
    electionRunCount: 5,
    pastElections: [
      { year: 1998, electionName: '제2회 전국동시지방선거', district: '서울 종로 교남동', party: '무소속', votes: 1954, votePct: 50.24, rank: 1, result: '당선', note: '초선', sourceUrl: 'https://ko.wikipedia.org/wiki/유찬종', sourceLicense: 'CC BY-SA 4.0' },
      { year: 2002, electionName: '제3회 전국동시지방선거', district: '서울 종로 교남동', party: '무소속', votes: 1931, votePct: 52.27, rank: 1, result: '당선', note: '재선', sourceUrl: 'https://ko.wikipedia.org/wiki/유찬종', sourceLicense: 'CC BY-SA 4.0' },
      { year: 2006, electionName: '제4회 전국동시지방선거', district: '서울 종로 가', party: '민주당', votes: 2527, votePct: 14.30, rank: 4, result: '낙선', sourceUrl: 'https://ko.wikipedia.org/wiki/유찬종', sourceLicense: 'CC BY-SA 4.0' },
      { year: 2014, electionName: '제6회 전국동시지방선거', district: '서울 종로 제2선거구', party: '새정치민주연합', votes: 20630, votePct: 52.09, rank: 1, result: '당선', note: '초선 9대 시의원', sourceUrl: 'https://ko.wikipedia.org/wiki/유찬종', sourceLicense: 'CC BY-SA 4.0' },
      { year: 2022, electionName: '제8회 전국동시지방선거', district: '서울 종로구청장', party: '더불어민주당', votes: 32857, votePct: 47.09, rank: 2, result: '낙선', sourceUrl: 'https://ko.wikipedia.org/wiki/유찬종', sourceLicense: 'CC BY-SA 4.0' },
    ],
    // ─── #14 추가 ───
    nameEnglish: 'Yoo Chan Jong', // 서울시의회 9대 의원 등록명 (smc.seoul.kr)
    // 서울시의회 9대 의정활동 (2014-07-01 ~ 2018-04-12 / 종로구 제2선거구)
    // 출처: https://www.smc.seoul.kr/main/memberPop.do?mno=872&period=9
    councilTerms: [
      { council: '서울특별시의회 9대', position: '서울특별시의회의원', start: '2014-07-01', end: '2018-04-12', electoralDistrict: '종로구 제2선거구', sourceUrl: 'https://www.smc.seoul.kr/main/memberPop.do?mno=872&period=9', sourceLicense: 'public_record' },
      { council: '서울특별시의회 9대', position: '주택공간위원회위원', start: '2014-07-17', end: '2018-04-12', sourceUrl: 'https://www.smc.seoul.kr/main/memberPop.do?mno=872&period=9', sourceLicense: 'public_record' },
      { council: '서울특별시의회 9대', position: '한옥지원특별위원회위원', start: '2014-12-19', end: '2016-04-18', sourceUrl: 'https://www.smc.seoul.kr/main/memberPop.do?mno=872&period=9', sourceLicense: 'public_record' },
      { council: '서울특별시의회 9대', position: '예산결산특별위원회위원', start: '2015-09-03', end: '2016-09-09', sourceUrl: 'https://www.smc.seoul.kr/main/memberPop.do?mno=872&period=9', sourceLicense: 'public_record' },
      // #14 결정 C: "특혜의혹" 단어 포함 위원회 → needsReview + displayLabel 축약
      { council: '서울특별시의회 9대', position: '서울국제금융센터(SIFC) 특혜의혹 진상규명을 위한 행정사무조사 특별위원회위원', displayLabel: '서울국제금융센터(SIFC) 진상규명 행정사무조사 특별위원회위원', needsReview: true, start: '2015-12-21', end: '2016-06-20', sourceUrl: 'https://www.smc.seoul.kr/main/memberPop.do?mno=872&period=9', sourceLicense: 'public_record' },
      { council: '서울특별시의회 9대', position: '정책위원회위원', start: '2016-08-01', end: '2017-07-31', sourceUrl: 'https://www.smc.seoul.kr/main/memberPop.do?mno=872&period=9', sourceLicense: 'public_record' },
      { council: '서울특별시의회 9대', position: '예산결산특별위원회위원', start: '2016-09-10', end: '2017-09-09', sourceUrl: 'https://www.smc.seoul.kr/main/memberPop.do?mno=872&period=9', sourceLicense: 'public_record' },
      { council: '서울특별시의회 9대', position: '서울주택도시공사 사장 후보자 인사청문특별위원회위원', start: '2017-12-15', end: '2017-12-21', sourceUrl: 'https://www.smc.seoul.kr/main/memberPop.do?mno=872&period=9', sourceLicense: 'public_record' },
    ],
    necId: '100154016',
    status: 'active',
    reviewStatus: 'reviewed',
    reviewedBy: REVIEWED_BY,
  },
  {
    id: 'cand_jongno_2',
    districtId: 'district_seoul_jongno',
    electionId: 'election_2026_local',
    ballotNumber: 2,
    name: '정문헌',
    nameHanja: '鄭文憲',
    party: '국민의힘',
    birthYear: 1966,
    birthDate: '1966-05-04',
    gender: 'M',
    occupation: '종로구청장',
    education: '고려대학교 대학원 정치외교학과 졸업(정치학 박사)',
    career: [
      '(전)17대,19대 국회의원',
      '(전)청와대 통일비서관',
    ],
    electionRunCount: 3,
    // ─── #14 추가 (Wikidata Q16175546, 출생일 1966-05-04 가드레일 통과) ───
    highSchool: '경복고등학교',
    councilTerms: [
      // 출처: https://www.wikidata.org/wiki/Q16175546 (CC0)
      { council: '대한민국 국회 17대', position: '국회의원', start: '2004-05-30', end: '2008-05-29', electoralDistrict: '강원도 속초시·고성군·양양군', sourceUrl: 'https://www.wikidata.org/wiki/Q16175546', sourceLicense: 'CC0' },
      { council: '대한민국 국회 19대', position: '국회의원', start: '2012-05-30', end: '2016-05-29', electoralDistrict: '강원도 속초시·고성군·양양군', sourceUrl: 'https://www.wikidata.org/wiki/Q16175546', sourceLicense: 'CC0' },
    ],
    necId: '100163635',
    status: 'active',
    reviewStatus: 'reviewed',
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

  // ─── 실데이터: 서울 종로구청장 후보 2명 (2026-05-28 NEC info.nec 수집) ───
  // assetBreakdown 비율은 TIF 스캔 OCR 필요 — 현재는 보수적 placeholder (0,0,0,100=기타)
  // 추후 운영자 검수 후 실제 비율 입력 (#13 §8-3 Phase B)
  {
    candidateId: 'cand_jongno_1',
    assetTotal: 4_060_212_000, // 4,060,212천원 → 원 단위 환산
    assetBreakdown: { realEstate: 0, deposit: 0, securities: 0, other: 0 }, // 분해 비율 미수집 — 등록서류 OCR 검수 후 표시
    criminalRecords: [],
    criminalRecordCountSummary: 0,
    taxArrears: [],
    fiveYearTaxPaidKrw: 848_620_000,
    fiveYearTaxArrearsKrw: 0,
    currentTaxArrearsKrw: 0,
    militaryRecord: '군복무를 마친사람',
    // militarySummary는 NEC 등록서류 스캔(gubun=4) 검수 후 채움 — 미수집 단계에서 외부 인용 금지
    photoUrl: 'http://cdn.nec.go.kr/photo_20260603/Gsg1101/Hb100154016/gicho/100154016.JPG',
    sourceUrls: [
      'http://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId=100154016',
    ],
    sourcePublishedAt: '2026-05-13',
    sourceCheckedAt: '2026-05-28',
  },
  {
    candidateId: 'cand_jongno_2',
    assetTotal: 2_625_265_000, // 2,625,265천원 → 원 단위
    assetBreakdown: { realEstate: 0, deposit: 0, securities: 0, other: 0 }, // 분해 비율 미수집 — 등록서류 OCR 검수 후 표시
    criminalRecords: [], // 1건 있으나 detail은 TIF 필요 — 요약 수치만 표시
    criminalRecordCountSummary: 1, // info.nec 요약 ("전과기록유무: 1건")
    taxArrears: [],
    fiveYearTaxPaidKrw: 642_082_000,
    fiveYearTaxArrearsKrw: 0,
    currentTaxArrearsKrw: 0,
    militaryRecord: '군복무를 마친사람',
    // militarySummary는 NEC 등록서류 스캔(gubun=4) 검수 후 채움
    photoUrl: 'http://cdn.nec.go.kr/photo_20260603/Gsg1101/Hb100163635/gicho/100163635.JPG',
    sourceUrls: [
      'http://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId=100163635',
    ],
    sourcePublishedAt: '2026-05-13',
    sourceCheckedAt: '2026-05-28',
    // ─── #14 추가: peti 재산 detail (2026-03-26 정기 변동등록 공개) ───
    // 출처: 정부공직자윤리위원회 공고 제2026-4호
    // privacy: 시·도 단위만 / 본인+가족 합계만 (#14 결정 A·B)
    petiBreakdown: {
      asOf: '2025-12-31',
      disclosedAt: '2026-03-26',
      publicNoticeNo: '정부공직자윤리위원회 공고 제2026-4호',
      categories: [
        { name: '건물', totalKrw: 1_362_000_000, itemCount: 2, yearOverYearChangeKrw: 34_000_000 },
        { name: '토지', totalKrw: 797_950_000, itemCount: 18, yearOverYearChangeKrw: 10_376_000 },
        { name: '예금', totalKrw: 378_241_000, itemCount: 4, yearOverYearChangeKrw: -86_401_000 },
        { name: '회원권', totalKrw: 185_200_000, itemCount: 3 },
        { name: '증권', totalKrw: 161_594_000, itemCount: 2, yearOverYearChangeKrw: 42_334_000 },
        { name: '자동차등', totalKrw: 66_560_000, itemCount: 4, yearOverYearChangeKrw: -10_180_000 },
        { name: '가상자산', totalKrw: 36_620_000, itemCount: 2, yearOverYearChangeKrw: -177_334_000 },
        { name: '채무', totalKrw: -376_643_000, itemCount: 1, yearOverYearChangeKrw: 28_553_000 },
      ],
      realEstateRegions: [
        { region: '충청남도', itemCount: 6 },
        { region: '강원특별자치도', itemCount: 3 },
      ],
      selfOnlyKrw: 2_697_216_000,
      selfPlusFamilyKrw: 3_384_487_000,
    },
  },
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

  // ─── 실데이터: 유찬종 (서울 종로구청장, 더민주 기호 1) 5대공약 ───
  // NEC OCR 텍스트 수집 (UELPromisePopupView.do, ocrCnvrSeqNo=11610)
  // NEC 4요소(목표·이행방법·이행기간·재원조달) 모두 명시, 지표는 본문 없음 → score 4점 상한
  {
    id: 'pr_jongno_1_1',
    candidateId: 'cand_jongno_1',
    orderNo: 1,
    title: '생활경제·일자리 회복 프로젝트, 다시 살아나는 종로경제',
    body: '종로형 공공·민간 협력 일자리 확대, 골목상권·전통시장·로컬경제 회복, 주민이 직접 체감하는 지역순환경제 구축. 주민채용 유지지원금 제도, 도시형 제조특구, 백년이음 청년명장 육성. 임기 즉시 추진 ~ 임기 내 단계별 확대. 재원: 구비·시비·국비 및 중앙정부 공모사업.',
    category: 'welfare',
    specificityScore: 4,
    necElements: { goal: true, method: true, period: true, funding: true, indicator: false },
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
  },
  {
    id: 'pr_jongno_1_2',
    candidateId: 'cand_jongno_1',
    orderNo: 2,
    title: '아이부터 어르신까지 누구나 안심하는 종로',
    body: '24시 안심돌봄센터 설치, 영유아·초등 온종일 돌봄 확대, 창신·숭인 우리동네 보건소, 어르신 데이케어센터 건립, 1인가구 고독사 예방 안전망. 임기 내 단계별 시행. 재원: 구비·시비·국비.',
    category: 'welfare',
    specificityScore: 4,
    necElements: { goal: true, method: true, period: true, funding: true, indicator: false },
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
  },
  {
    id: 'pr_jongno_1_3',
    candidateId: 'cand_jongno_1',
    orderNo: 3,
    title: '미래를 배우고 세계가 찾는 문화도시 종로',
    body: '교육지원예산 100억원 확대, 학교시설 지역개방, AI·미래교육 환경 조성, 구립 AI센터 및 AI 도서관, K-컬처 글로벌 콘텐츠, 대학로 글로벌 퍼포먼스 위크. 임기 내 단계별 시행.',
    category: 'education',
    specificityScore: 4,
    necElements: { goal: true, method: true, period: true, funding: true, indicator: false },
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
  },
  {
    id: 'pr_jongno_1_4',
    candidateId: 'cand_jongno_1',
    orderNo: 4,
    title: '더 살기 좋은 종로, 삶이 편안한 생활환경',
    body: '창신·숭인동 주민 중심 개발, 이화동 성곽마을 정주환경, 빈집 공공활용·노후주택 집수리, 그린 종로·청정 숨 프로젝트(도심 미니숲·옥상녹화), 골목 화재안전 개선. 임기 내 단계별 시행.',
    category: 'housing',
    specificityScore: 4,
    necElements: { goal: true, method: true, period: true, funding: true, indicator: false },
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
  },
  {
    id: 'pr_jongno_1_5',
    candidateId: 'cand_jongno_1',
    orderNo: 5,
    title: '교통 불편은 줄이고, 주민과 더 가까운 종로',
    body: '강북횡단선 재추진 건의, 골목길·고지대 생활교통 개선(도로열선·스마트 주차안내), AI 통학로·신호체계, 찾아가는 구청장실 및 종로에 답하다 주민소통 플랫폼, 주민참여예산 확대. 임기 내 단계별 시행.',
    category: 'transport',
    specificityScore: 4,
    necElements: { goal: true, method: true, period: true, funding: true, indicator: false },
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
  },

  // ─── 실데이터: 정문헌 (서울 종로구청장, 국민의힘 기호 2) 5대공약 — 제목만 보존, body는 추후 수집 ───
  {
    id: 'pr_jongno_2_1',
    candidateId: 'cand_jongno_2',
    orderNo: 1,
    title: '살수록 좋아지는 종로, 재개발에 속도를 주거에 품격을',
    body: '재개발·재정비 가속화, 노후 주거지 정비. (본문 OCR 추가 수집 대상)',
    category: 'housing',
    specificityScore: 3,
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
  },
  {
    id: 'pr_jongno_2_2',
    candidateId: 'cand_jongno_2',
    orderNo: 2,
    title: '지갑이 두꺼워지는 종로, 골목에서 글로벌까지 경제 체력 강화',
    body: '골목상권·소상공인 지원, 글로벌 경쟁력 강화. (본문 OCR 추가 수집 대상)',
    category: 'welfare',
    specificityScore: 3,
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
  },
  {
    id: 'pr_jongno_2_3',
    candidateId: 'cand_jongno_2',
    orderNo: 3,
    title: '오늘이 편한 종로, 길도 안전도 새로고침',
    body: '교통·생활안전 인프라 개선. (본문 OCR 추가 수집 대상)',
    category: 'safety',
    specificityScore: 3,
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
  },
  {
    id: 'pr_jongno_2_4',
    candidateId: 'cand_jongno_2',
    orderNo: 4,
    title: '곁에 있는 종로, 돌봄·복지·건강 사각지대 제로',
    body: '돌봄·복지·건강 사각지대 해소. (본문 OCR 추가 수집 대상)',
    category: 'welfare',
    specificityScore: 3,
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
  },
  {
    id: 'pr_jongno_2_5',
    candidateId: 'cand_jongno_2',
    orderNo: 5,
    title: '아이 키우고 싶은 종로, 미래형 맞춤 교육',
    body: '미래형 교육 환경 조성, 보육 인프라 확충. (본문 OCR 추가 수집 대상)',
    category: 'education',
    specificityScore: 3,
    source: 'nec_policy',
    sourceUrl: 'https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do',
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
  // 4번 라후보 — needs_check
  {
    id: 'cc_004_1',
    candidateId: 'cand_004',
    type: 'source_missing',
    severity: 'info',
    title: '자료 확인 중',
    body: '자료 입력 전입니다. 원문 확인 후 반영됩니다.',
  },

  // ─── 실데이터: 유찬종 (info 카드 위주, NEC 요약 인용) ───
  {
    id: 'cc_jongno_1_1',
    candidateId: 'cand_jongno_1',
    type: 'criminal_record',
    severity: 'info',
    title: '공개된 전과 기록 없음',
    body: 'NEC 후보자정보공개 자료에 기재된 전과 기록이 없습니다 (요약 수치 기준).',
    sourceUrl: 'http://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId=100154016',
  },
  {
    id: 'cc_jongno_1_2',
    candidateId: 'cand_jongno_1',
    type: 'tax_arrears',
    severity: 'info',
    title: '공개된 체납 기록 없음',
    body: '최근 5년간 체납액 0원, 현체납액 0원으로 공개되어 있습니다.',
    sourceUrl: 'http://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId=100154016',
  },

  // ─── 실데이터: 정문헌 (전과 1건 요약, detail은 TIF 필요) ───
  {
    id: 'cc_jongno_2_1',
    candidateId: 'cand_jongno_2',
    type: 'criminal_record',
    severity: 'check',
    title: '공개된 전과 1건 (NEC 요약, 상세 검수 대기)',
    body: 'NEC 후보자정보공개 자료에 전과 1건이 공개되어 있습니다. 죄명·연도·결과 등 상세 내역은 NEC 등록서류 스캔 자료에 있으며 운영자 검수 후 추가 공개 예정입니다.',
    sourceUrl: 'http://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId=100163635',
  },
  {
    id: 'cc_jongno_2_2',
    candidateId: 'cand_jongno_2',
    type: 'tax_arrears',
    severity: 'info',
    title: '공개된 체납 기록 없음',
    body: '최근 5년간 체납액 0원, 현체납액 0원으로 공개되어 있습니다.',
    sourceUrl: 'http://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId=100163635',
  },
];
