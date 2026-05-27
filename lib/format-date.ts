// 날짜 표시 — 결정 F24: Asia/Seoul, 결정 C4: 'YYYY년 M월 D일 기준'

const KST_FMT = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

export function formatKstDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return '—';
  // ko-KR 출력: "2026. 5. 20." → 분해 후 재조립
  const parts = KST_FMT.formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const dd = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${y}년 ${m}월 ${dd}일`;
}

export function formatSourceBasis(iso: string | Date | null | undefined): string {
  const v = formatKstDate(iso);
  return v === '—' ? '자료 기준일 미상' : `${v} 기준`;
}
