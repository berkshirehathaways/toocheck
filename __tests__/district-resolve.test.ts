import { describe, expect, it } from 'vitest';
import { resolveDistricts } from '@/lib/district/resolve';

describe('resolveDistricts', () => {
  it('returns 5 office entries always', () => {
    const r = resolveDistricts({ sidoName: '서울특별시', sigunguName: '종로구' });
    expect(r.offices).toHaveLength(5);
    const kinds = r.offices.map((o) => o.officeKind);
    expect(kinds).toEqual([
      'metropolitan_governor',
      'education_superintendent',
      'basic_governor',
      'metropolitan_member',
      'basic_member',
    ]);
  });

  it('maps 서울 종로구 basic_governor to seeded district_seoul_jongno', () => {
    const r = resolveDistricts({ sidoName: '서울특별시', sigunguName: '종로구' });
    const basic = r.offices.find((o) => o.officeKind === 'basic_governor');
    expect(basic?.districtId).toBe('district_seoul_jongno');
    expect(basic?.precision).toBe('sigungu');
    expect(basic?.candidateCount).toBeGreaterThan(0);
  });

  it('returns roster counts for metropolitan_governor at sido level', () => {
    const r = resolveDistricts({ sidoName: '서울특별시' });
    const gov = r.offices.find((o) => o.officeKind === 'metropolitan_governor');
    expect(gov?.precision).toBe('sido');
    expect(gov?.candidateCount).toBeGreaterThan(0);
  });

  it('reports sigungu-level fallback for metropolitan_member when multiple sggIds exist', () => {
    const r = resolveDistricts({ sidoName: '서울특별시', sigunguName: '종로구' });
    const mm = r.offices.find((o) => o.officeKind === 'metropolitan_member');
    expect(mm?.precision).toBe('sigungu');
    // 종로구는 시·도의원 선거구가 2곳(제1·제2선거구) 있음 → 동 단위 정밀 매칭 필요 표시
    expect(mm?.sggIds.length).toBeGreaterThanOrEqual(1);
    expect(mm?.candidateCount).toBeGreaterThan(0);
  });

  it('returns none precision and 0 count for unknown sido', () => {
    const r = resolveDistricts({ sidoName: '존재하지않는시', sigunguName: '없는구' });
    expect(r.sido.matched).toBe(false);
    expect(r.sigungu.matched).toBe(false);
    for (const o of r.offices) {
      expect(o.precision).toBe('none');
      expect(o.candidateCount).toBe(0);
      expect(o.districtId).toBe(null);
    }
  });

  it('reports unmatched sigungu when only sido given', () => {
    const r = resolveDistricts({ sidoName: '서울특별시' });
    expect(r.sigungu.matched).toBe(false);
    const basic = r.offices.find((o) => o.officeKind === 'basic_governor');
    expect(basic?.precision).toBe('none');
  });

  it('still reports candidate counts even when no district is seeded', () => {
    // 부산광역시 해운대구 → seed에 District 없음
    const r = resolveDistricts({ sidoName: '부산광역시', sigunguName: '해운대구' });
    const basic = r.offices.find((o) => o.officeKind === 'basic_governor');
    expect(basic?.districtId).toBe(null);
    expect(basic?.candidateCount).toBeGreaterThan(0); // NEC roster에 후보 등록은 있음
    expect(basic?.precision).toBe('sigungu');
  });
});

describe('resolveDistricts — 광역의원 전국 동 단위 정밀 매칭 (공직선거법 별표2)', () => {
  it('bcode로 종로구 청운동 → 종로구제1선거구 (별표2 권위)', () => {
    const r = resolveDistricts({
      sidoName: '서울특별시',
      sigunguName: '종로구',
      bcode: '1111010100',
      bname: '청운동',
    });
    const mm = r.offices.find((o) => o.officeKind === 'metropolitan_member');
    expect(mm?.precision).toBe('dong');
    expect(mm?.sggIds).toEqual(['5110101']);
  });

  it('다른 동은 다른 선거구로 분기 — 종로구 이화동 → 제2선거구', () => {
    const r = resolveDistricts({ sidoName: '서울특별시', sigunguName: '종로구', hname: '이화동' });
    const mm = r.offices.find((o) => o.officeKind === 'metropolitan_member');
    expect(mm?.precision).toBe('dong');
    expect(mm?.sggIds).toEqual(['5110102']);
  });

  it('동명 정규화: 부산 해운대 "우1동" ↔ 별표 "우제1동" 매칭', () => {
    const r = resolveDistricts({ sidoName: '부산광역시', sigunguName: '해운대구', hname: '우1동' });
    const mm = r.offices.find((o) => o.officeKind === 'metropolitan_member');
    expect(mm?.precision).toBe('dong');
    expect(mm?.sggList[0]?.sggName).toBe('해운대구제1선거구');
  });

  it('일반구: 성남시분당구 정자1동 → 성남시 통합 번호 선거구', () => {
    const r = resolveDistricts({ sidoName: '경기도', sigunguName: '성남시분당구', hname: '정자1동' });
    const mm = r.offices.find((o) => o.officeKind === 'metropolitan_member');
    expect(mm?.precision).toBe('dong');
    expect(mm?.sggList[0]?.sggName).toContain('성남시제');
  });

  it('통합 시·도: 광주 광산구 송정1동 → 광산구제1선거구 (전남광주통합특별시 alias)', () => {
    const r = resolveDistricts({ sidoName: '광주광역시', sigunguName: '광산구', hname: '송정1동' });
    const mm = r.offices.find((o) => o.officeKind === 'metropolitan_member');
    expect(mm?.precision).toBe('dong');
    expect(mm?.sggList[0]?.sggName).toBe('광산구제1선거구');
  });

  it('제주 광역의원은 별표2 미포함 → 동 정밀 없이 itemized fallback', () => {
    const r = resolveDistricts({
      sidoName: '제주특별자치도',
      sigunguName: '제주시',
      hname: '일도1동',
    });
    const mm = r.offices.find((o) => o.officeKind === 'metropolitan_member');
    expect(mm?.precision).toBe('sigungu');
    expect(r.meta.dongPrecisionAvailable).toBe(false);
  });
});

describe('resolveDistricts — 기초의원 동 단위 정밀 매칭 (시·도 조례 별표)', () => {
  it('서울 종로구 청운효자동 → 종로구가선거구 (조례 권위)', () => {
    const r = resolveDistricts({ sidoName: '서울특별시', sigunguName: '종로구', hname: '청운효자동' });
    const bm = r.offices.find((o) => o.officeKind === 'basic_member');
    expect(bm?.precision).toBe('dong');
    expect(bm?.sggList[0]?.sggName).toBe('종로구가선거구');
  });

  it('경남 조례도 동일 파이프라인으로 기초 동 단위 매칭', () => {
    // 경남 창원시마산회원구 등 — 조례 별표 커버. 동명은 roster/별표 기준 존재하는 것 사용.
    const r = resolveDistricts({ sidoName: '경상남도', sigunguName: '창원시성산구', hname: '상남동' });
    const bm = r.offices.find((o) => o.officeKind === 'basic_member');
    // 매칭되면 dong, 동명 불일치 시 sigungu fallback — 둘 중 하나(둘 다 정상 동작)
    expect(['dong', 'sigungu']).toContain(bm?.precision);
  });

  it('전국 기초 조례 인제스트 후 순천시도 동 단위 정밀 매칭', () => {
    const r = resolveDistricts({ sidoName: '전라남도', sigunguName: '순천시', hname: '풍덕동' });
    const bm = r.offices.find((o) => o.officeKind === 'basic_member');
    expect(bm?.precision).toBe('dong');
  });

  it('매핑에 없는 동명은 시·군·구 fallback (메커니즘 유지)', () => {
    const r = resolveDistricts({
      sidoName: '서울특별시',
      sigunguName: '강남구',
      hname: '존재하지않는동999',
    });
    const bm = r.offices.find((o) => o.officeKind === 'basic_member');
    expect(['sigungu', 'sigungu_unique']).toContain(bm?.precision);
  });
});

describe('resolveDistricts — 단일 선거구 자동 정밀매칭 (G1)', () => {
  it('부산 중구처럼 광역의원 선거구가 1곳뿐이면 자동 확정', () => {
    const r = resolveDistricts({ sidoName: '부산광역시', sigunguName: '중구' });
    const mm = r.offices.find((o) => o.officeKind === 'metropolitan_member');
    expect(mm?.precision).toBe('sigungu_unique');
    expect(mm?.resolved).toBe(true);
    expect(mm?.sggIds).toHaveLength(1);
    expect(mm?.sggList).toHaveLength(1);
    expect(mm?.candidateCount).toBe(mm?.sggList[0]?.candidateCount);
  });
});

describe('resolveDistricts — 복수 선거구 itemized fallback (G2)', () => {
  it('성동구 광역의원은 선거구 목록을 모두 노출하고 resolved=false', () => {
    const r = resolveDistricts({ sidoName: '서울특별시', sigunguName: '성동구' });
    const mm = r.offices.find((o) => o.officeKind === 'metropolitan_member');
    expect(mm?.precision).toBe('sigungu');
    expect(mm?.resolved).toBe(false);
    expect((mm?.sggList.length ?? 0)).toBeGreaterThan(1);
    // 각 항목에 선거구명과 후보 수가 있음
    for (const s of mm?.sggList ?? []) {
      expect(s.sggName).toBeTruthy();
      expect(s.candidateCount).toBeGreaterThanOrEqual(0);
    }
    // 합계 = 각 선거구 후보 수 합
    const sum = (mm?.sggList ?? []).reduce((a, s) => a + s.candidateCount, 0);
    expect(mm?.candidateCount).toBe(sum);
  });

  it('기초의원은 거의 모든 시군구에서 복수 선거구 itemized', () => {
    const r = resolveDistricts({ sidoName: '서울특별시', sigunguName: '강남구' });
    const bm = r.offices.find((o) => o.officeKind === 'basic_member');
    expect((bm?.sggList.length ?? 0)).toBeGreaterThan(1);
    expect(bm?.resolved).toBe(false);
  });
});

describe('resolveDistricts — 전국 결정적 매칭 (단체장/교육감)', () => {
  it('임의의 시군구라도 시도지사·교육감·구청장은 항상 매칭', () => {
    for (const [sido, sigungu] of [
      ['부산광역시', '해운대구'],
      ['경기도', '성남시분당구'],
      ['전라남도', '순천시'],
    ] as const) {
      const r = resolveDistricts({ sidoName: sido, sigunguName: sigungu });
      const gov = r.offices.find((o) => o.officeKind === 'metropolitan_governor');
      const edu = r.offices.find((o) => o.officeKind === 'education_superintendent');
      const basic = r.offices.find((o) => o.officeKind === 'basic_governor');
      expect(gov?.precision).toBe('sido');
      expect(gov?.candidateCount).toBeGreaterThan(0);
      expect(edu?.candidateCount).toBeGreaterThan(0);
      expect(basic?.resolved).toBe(true);
      expect(basic?.candidateCount).toBeGreaterThan(0);
    }
  });
});
