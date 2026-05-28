// NEC 공약 원문 본문(body)은 줄바꿈 없이 한 줄로 합쳐져 있고, 문서의 계층 구조가
// 기호로만 남아 있다: □ 대분류(목표/이행방법/이행기간/재원조달 등), ○·▶·▷·※ 항목,
// " - " 하위 항목. 이를 파싱해 가독성 있는 계층 블록으로 변환한다.
//
// 주의: "K-모두의기후동행카드"처럼 단어 내부 하이픈이 있으므로 하위 항목은
// 반드시 공백으로 둘러싸인 하이픈(" - " / " – ")만 분리한다.

export interface PromiseBullet {
  text: string;
  subs: string[];
}

export interface PromiseBlock {
  /** □ 대분류 제목. 도입부(첫 □ 이전)는 null. */
  heading: string | null;
  bullets: PromiseBullet[];
  /** 항목 기호 없이 이어진 본문(도입부 문장 등). */
  lead: string;
}

export interface ParsedPromiseBody {
  blocks: PromiseBlock[];
  /** 계층 구조 추출에 성공하면 true, 단문이면 false(원문 단락 렌더). */
  structured: boolean;
}

const BULLET_RE = /[○▶▷※]/;
const SUB_RE = /\s[-–]\s/;

/** 본문 앞부분의 "<제목> 공약 내용 펼치기" 군더더기를 제거한다. */
function stripPrefix(body: string): string {
  const marker = '공약 내용 펼치기';
  const idx = body.indexOf(marker);
  if (idx >= 0) return body.slice(idx + marker.length);
  return body;
}

function splitBullets(region: string): { lead: string; bullets: PromiseBullet[] } {
  const parts = region.split(BULLET_RE);
  const lead = (parts.shift() ?? '').trim();
  const bullets: PromiseBullet[] = [];
  for (const raw of parts) {
    const seg = raw.trim();
    if (!seg) continue;
    const subParts = seg.split(SUB_RE).map((s) => s.trim()).filter(Boolean);
    const text = subParts.shift() ?? '';
    bullets.push({ text, subs: subParts });
  }
  return { lead, bullets };
}

export function parsePromiseBody(body: string): ParsedPromiseBody {
  const cleaned = stripPrefix(body).replace(/\s+/g, ' ').trim();
  if (!cleaned) return { blocks: [], structured: false };

  // 구조 기호가 전혀 없으면 단문 — 원문 단락으로 렌더.
  if (!cleaned.includes('□') && !BULLET_RE.test(cleaned)) {
    return { blocks: [{ heading: null, lead: cleaned, bullets: [] }], structured: false };
  }

  const sections = cleaned.split('□');
  const preambleRaw = (sections.shift() ?? '').trim();
  const blocks: PromiseBlock[] = [];

  if (preambleRaw) {
    const { lead, bullets } = splitBullets(preambleRaw);
    if (lead || bullets.length) blocks.push({ heading: null, lead, bullets });
  }

  for (const sec of sections) {
    const seg = sec.trim();
    if (!seg) continue;
    // 제목 = 첫 항목 기호 이전 텍스트.
    const m = seg.search(BULLET_RE);
    let heading = (m >= 0 ? seg.slice(0, m) : seg).trim();
    const rest = m >= 0 ? seg.slice(m) : '';
    const { lead: leadRaw, bullets } = splitBullets(rest);
    let lead = leadRaw;
    // 항목 기호 없이 "목표 : 내용" 형태면 라벨/본문으로 분리(긴 제목 방지).
    if (!bullets.length && !lead) {
      const colon = heading.search(/[:：]/);
      if (colon > 0 && colon <= 12) {
        lead = heading.slice(colon + 1).trim();
        heading = heading.slice(0, colon).trim();
      }
    }
    blocks.push({ heading: heading || null, lead, bullets });
  }

  const structured = blocks.some((b) => b.heading || b.bullets.length > 0);
  return { blocks, structured };
}
