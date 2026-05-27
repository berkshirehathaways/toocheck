import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import type * as React from 'react';

import { SATORI_FONTS } from './fonts';

export type ShareCardSize = 'square' | 'story' | 'wide';

const SIZES: Record<ShareCardSize, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  wide: { width: 1080, height: 566 },
};

export async function renderShareCardPng(
  element: React.ReactElement,
  size: ShareCardSize = 'square'
): Promise<Uint8Array> {
  const { width, height } = SIZES[size];
  const svg = await satori(element, {
    width,
    height,
    fonts: SATORI_FONTS,
  });
  const resvg = new Resvg(svg, {
    background: '#ffffff',
    fitTo: { mode: 'width', value: width },
  });
  return resvg.render().asPng();
}

export function pngResponse(png: Uint8Array, filename: string): Response {
  return new Response(png as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      // 결정 F9: 캐시 없음
      'Cache-Control': 'no-store',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}

export function pickSize(searchParams: URLSearchParams): ShareCardSize {
  const v = searchParams.get('size');
  if (v === 'square' || v === 'story' || v === 'wide') return v;
  return 'square';
}
