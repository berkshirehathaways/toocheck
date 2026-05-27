// 금액 표시 — 결정 F25: 1자리 (`12.3억`)
// 입력은 원 단위 (PRD §12.2), 1억 미만은 만원/원 단위로 폴백.

const EOK = 100_000_000; // 1억
const MAN = 10_000; // 1만

export function formatKrwShort(won: number | null | undefined): string {
  if (won === null || won === undefined || Number.isNaN(won)) return '—';
  if (won === 0) return '0원';
  const absVal = Math.abs(won);
  const sign = won < 0 ? '-' : '';
  if (absVal >= EOK) {
    const eok = absVal / EOK;
    const rounded = Math.round(eok * 10) / 10;
    return `${sign}${rounded.toLocaleString('ko-KR')}억`;
  }
  if (absVal >= MAN) {
    const man = Math.round(absVal / MAN);
    return `${sign}${man.toLocaleString('ko-KR')}만원`;
  }
  return `${sign}${absVal.toLocaleString('ko-KR')}원`;
}

export function formatKrwFull(won: number | null | undefined): string {
  if (won === null || won === undefined || Number.isNaN(won)) return '—';
  return `${won.toLocaleString('ko-KR')}원`;
}
