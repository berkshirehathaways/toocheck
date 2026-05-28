// 결정 F13: sort 처리 위치 = API 측 (?sort= query, URL 공유 시 정렬 상태 유지)
import type { Candidate, CompareRow } from '@/types/domain';

// 공약 구체성 정렬 옵션은 자동 판정 결과 노출 위험으로 제거 (정치적 중립)
export const SORT_KEYS = [
  'ballot', // 기호순
  'name', // 이름순
  'asset_desc', // 재산↑
  'asset_asc', // 재산↓
  'criminal_first', // 전과 공개 우선
  'tax_first', // 체납 공개 우선
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_LABEL: Record<SortKey, string> = {
  ballot: '기호순',
  name: '이름순',
  asset_desc: '재산신고액 높은 순',
  asset_asc: '재산신고액 낮은 순',
  criminal_first: '전과기록 공개자료 있음 우선',
  tax_first: '체납기록 공개자료 있음 우선',
};

export function isSortKey(s: string | null | undefined): s is SortKey {
  return !!s && (SORT_KEYS as readonly string[]).includes(s);
}

const KO = new Intl.Collator('ko-KR');

export function sortCompareRows(rows: CompareRow[], key: SortKey): CompareRow[] {
  const arr = [...rows];
  // 정렬 1차: review_status — needs_check는 항상 마지막
  const isPending = (c: Candidate) => c.reviewStatus !== 'reviewed';

  arr.sort((a, b) => {
    const aPending = isPending(a.candidate);
    const bPending = isPending(b.candidate);
    if (aPending !== bPending) return aPending ? 1 : -1;

    switch (key) {
      case 'ballot':
        return a.candidate.ballotNumber - b.candidate.ballotNumber;
      case 'name':
        return KO.compare(a.candidate.name, b.candidate.name);
      case 'asset_desc': {
        const av = a.disclosure?.assetTotal ?? -Infinity;
        const bv = b.disclosure?.assetTotal ?? -Infinity;
        return bv - av;
      }
      case 'asset_asc': {
        const av = a.disclosure?.assetTotal ?? Infinity;
        const bv = b.disclosure?.assetTotal ?? Infinity;
        return av - bv;
      }
      case 'criminal_first': {
        const av = (a.disclosure?.criminalRecords.length ?? 0) > 0 ? 1 : 0;
        const bv = (b.disclosure?.criminalRecords.length ?? 0) > 0 ? 1 : 0;
        if (av !== bv) return bv - av;
        return a.candidate.ballotNumber - b.candidate.ballotNumber;
      }
      case 'tax_first': {
        const av = (a.disclosure?.taxArrears.length ?? 0) > 0 ? 1 : 0;
        const bv = (b.disclosure?.taxArrears.length ?? 0) > 0 ? 1 : 0;
        if (av !== bv) return bv - av;
        return a.candidate.ballotNumber - b.candidate.ballotNumber;
      }
      default:
        return 0;
    }
  });
  return arr;
}
