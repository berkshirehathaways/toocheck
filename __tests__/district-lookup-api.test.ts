import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/districts/lookup/route';

function makeReq(query: Record<string, string>): Request {
  const url = new URL('http://localhost/api/districts/lookup');
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  return new Request(url.toString(), { method: 'GET' });
}

describe('GET /api/districts/lookup', () => {
  it('returns 400 when sido is missing', async () => {
    const res = await GET(makeReq({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('bad_request');
  });

  it('returns 200 with 5 office entries for valid sido+sigungu', async () => {
    const res = await GET(makeReq({ sido: '서울특별시', sigungu: '종로구' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.offices).toHaveLength(5);
    expect(body.sido.matched).toBe(true);
    expect(body.sigungu.matched).toBe(true);
  });

  it('echoes input', async () => {
    const res = await GET(makeReq({ sido: '서울특별시', sigungu: '종로구', zonecode: '03048' }));
    const body = await res.json();
    expect(body.input.sidoName).toBe('서울특별시');
    expect(body.input.sigunguName).toBe('종로구');
    expect(body.input.zonecode).toBe('03048');
  });
});
