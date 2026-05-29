import { renderShareCardPng } from '@/lib/share-card/render';
import { SiteOgTemplate } from '@/lib/share-card/templates/site';

// 사이트 대표 OG 이미지 (카카오/SNS 링크 썸네일). 시안 2 — 라임 스탬프 타이포.
// Next.js 메타데이터 규약: 이 파일이 전 페이지의 og:image / twitter:image 를 자동 주입.
export const runtime = 'nodejs';

export const alt = '투표 전 체크 · 투체크 — 공개자료 기반 정치 중립 후보 비교';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const png = await renderShareCardPng(<SiteOgTemplate />, 'og');
  // satori/resvg 결과(Uint8Array)를 그대로 이미지 응답으로 반환.
  return new Response(png as BodyInit, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
