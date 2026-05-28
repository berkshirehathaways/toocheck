import { describe, expect, it } from 'vitest';
import { parsePromiseBody } from '@/lib/promise-format';

describe('parsePromiseBody', () => {
  it('단문(구조 기호 없음)은 structured=false 단일 블록', () => {
    const r = parsePromiseBody('행정수도 헌법 명문화, 개헌');
    expect(r.structured).toBe(false);
    expect(r.blocks).toHaveLength(1);
    expect(r.blocks[0]?.lead).toBe('행정수도 헌법 명문화, 개헌');
  });

  it('"공약 내용 펼치기" 접두 군더더기를 제거한다', () => {
    const body = "AI행정혁신 공약 내용 펼치기 □ 목 표 ○ 신청주의 타파";
    const r = parsePromiseBody(body);
    expect(r.structured).toBe(true);
    expect(r.blocks[0]?.heading).toBe('목 표');
    expect(r.blocks[0]?.bullets[0]?.text).toBe('신청주의 타파');
    // 접두에 들어있던 제목이 본문에 새지 않는다
    expect(JSON.stringify(r)).not.toContain('펼치기');
  });

  it('□ 대분류 / ○ 항목 / " - " 하위 항목을 계층으로 분리', () => {
    const body =
      "x 공약 내용 펼치기 □ 이행방법 ○ 격자형 철도망 구축 - 동부선 신설 - 서부선 재추진 □ 재원조달 ○ 정부지원금 확보";
    const r = parsePromiseBody(body);
    expect(r.blocks.map((b) => b.heading)).toEqual(['이행방법', '재원조달']);
    const first = r.blocks[0]?.bullets[0];
    expect(first?.text).toBe('격자형 철도망 구축');
    expect(first?.subs).toEqual(['동부선 신설', '서부선 재추진']);
    expect(r.blocks[1]?.bullets[0]?.text).toBe('정부지원금 확보');
  });

  it('단어 내부 하이픈(K-모두)은 하위 항목으로 쪼개지 않는다', () => {
    const body = 'x 공약 내용 펼치기 □ 목표 ○ K-모두의기후동행카드 도입';
    const r = parsePromiseBody(body);
    expect(r.blocks[0]?.bullets[0]?.text).toBe('K-모두의기후동행카드 도입');
    expect(r.blocks[0]?.bullets[0]?.subs).toEqual([]);
  });

  it('항목 기호 없는 "목표 : 내용"은 라벨/본문으로 분리', () => {
    const body = "x 공약 내용 펼치기 □ 목 표 : 31만 호 착공 □ 이행방법 ○ 규제 혁파";
    const r = parsePromiseBody(body);
    expect(r.blocks[0]?.heading).toBe('목 표');
    expect(r.blocks[0]?.lead).toBe('31만 호 착공');
    expect(r.blocks[0]?.bullets).toEqual([]);
    expect(r.blocks[1]?.heading).toBe('이행방법');
    expect(r.blocks[1]?.bullets[0]?.text).toBe('규제 혁파');
  });

  it('▶·▷·※ 도 항목 기호로 처리', () => {
    const body = 'x 공약 내용 펼치기 □ 목표 ▶ 첫째 ▷ 둘째 ※ 참고';
    const r = parsePromiseBody(body);
    expect(r.blocks[0]?.bullets.map((b) => b.text)).toEqual(['첫째', '둘째', '참고']);
  });
});
