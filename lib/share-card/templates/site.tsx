import type * as React from 'react';
import { SITE } from '@/lib/site/config';

// 시안 2 — 라임 스탬프 타이포 (사이트 대표 OG, 1200×630).
// 다크 HUD 톤(#050505) + 블루프린트 그리드 + '체크' 라임 포스트잇 강조.
const BG = '#050505';
const INK = '#F3F4F6';
const CYAN = '#06b6d4';
const LIME = '#bef264';

const W = 1200;
const H = 630;
const GRID = 48;

function GridBackdrop() {
  const lines: React.ReactNode[] = [];
  for (let x = GRID; x < W; x += GRID) {
    lines.push(
      <div
        key={`v${x}`}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: x,
          width: 1,
          background: 'rgba(255,255,255,0.045)',
        }}
      />
    );
  }
  for (let y = GRID; y < H; y += GRID) {
    lines.push(
      <div
        key={`h${y}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: y,
          height: 1,
          background: 'rgba(255,255,255,0.045)',
        }}
      />
    );
  }
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, display: 'flex' }}>
      {lines}
    </div>
  );
}

export function SiteOgTemplate() {
  return (
    <div
      style={{
        position: 'relative',
        width: W,
        height: H,
        background: BG,
        color: INK,
        fontFamily: 'Pretendard',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <GridBackdrop />

      {/* 라벨 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 4,
          color: CYAN,
          marginBottom: 38,
        }}
      >
        2026 지방선거 · 후보 비교
      </div>

      {/* 타이틀: 투표 전 [체크] */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 132, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>
          투표 전&nbsp;
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 132,
            fontWeight: 700,
            lineHeight: 1,
            color: BG,
            background: LIME,
            padding: '8px 22px 20px',
            marginLeft: 6,
            transform: 'rotate(-3deg)',
            boxShadow: '0 12px 26px rgba(190,242,100,0.30)',
          }}
        >
          체크
        </span>
      </div>

      {/* 도메인 워드마크 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          fontSize: 26,
          letterSpacing: 12,
          color: 'rgba(243,244,246,0.5)',
          marginTop: 52,
        }}
      >
        TOOCHECK.SITE
      </div>

      {/* 미세 보조 카피 */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          fontSize: 19,
          color: 'rgba(243,244,246,0.4)',
          marginTop: 18,
        }}
      >
        {SITE.disclaimerShort}
      </div>
    </div>
  );
}
