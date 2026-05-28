// 공통 헬퍼 — fetch + 한국어 디코딩 + JSESSIONID 추출.
// #14 §1 확정 파이프라인.

export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36';

export interface FetchHtmlOpts {
  headers?: Record<string, string>;
  cookies?: string;
  method?: 'GET' | 'POST';
  body?: string;
}

export async function fetchText(url: string, opts: FetchHtmlOpts = {}): Promise<{
  text: string;
  cookies: string;
  status: number;
}> {
  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers: {
      'User-Agent': UA,
      ...(opts.cookies ? { Cookie: opts.cookies } : {}),
      ...(opts.body
        ? { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        : {}),
      ...opts.headers,
    },
    body: opts.body,
    redirect: 'follow',
  });
  const text = await res.text();
  // Set-Cookie headers → merge into single cookie string
  const setCookies = res.headers.getSetCookie?.() ?? [];
  const cookies = setCookies
    .map((c) => c.split(';')[0])
    .filter(Boolean)
    .join('; ');
  return { text, cookies: cookies || opts.cookies || '', status: res.status };
}

export async function fetchJson<T = unknown>(
  url: string,
  opts: FetchHtmlOpts = {}
): Promise<T> {
  const { text } = await fetchText(url, opts);
  return JSON.parse(text) as T;
}

/** JSESSIONID 추출 (peti·policy.nec 등 쿠키 기반 사이트용). */
export function extractJsessionId(cookies: string): string | null {
  const m = cookies.match(/JSESSIONID=([^;]+)/);
  return m && m[1] ? m[1] : null;
}

/** 천원 → 원 환산. */
export function cheonwonToKrw(value: string | number): number {
  const n =
    typeof value === 'string' ? Number(value.replace(/,/g, '')) : value;
  return Math.round(n * 1000);
}

/** ISO date check. */
export function isoDate(s: unknown): string | null {
  if (typeof s !== 'string') return null;
  const m = s.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const m2 = s.match(/^\d{4}-\d{2}-\d{2}/);
  return m2 ? m2[0] : null;
}
