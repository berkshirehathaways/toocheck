import { Resvg } from '@resvg/resvg-js';

// 모바일 홈 화면 추가용 아이콘 (180×180 PNG). 시안 8 — 사이언/라임 스플릿 + 체크.
// Apple 아이콘은 PNG만 지원하므로 동일 SVG를 resvg로 래스터화.
export const runtime = 'nodejs';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const SVG = `<svg width="180" height="180" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#0c0d10"/>
  <path d="M0 0 H100 V100 Z" fill="#06b6d4"/>
  <path d="M0 0 V100 H100 Z" fill="#bef264"/>
  <path d="M28 50 L44 66 L74 32" fill="none" stroke="#050505" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function AppleIcon() {
  const png = new Resvg(SVG, { fitTo: { mode: 'width', value: size.width } }).render().asPng();
  return new Response(png as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
