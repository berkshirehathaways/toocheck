import type * as React from 'react';
import { SITE } from '@/lib/site/config';

export const COLORS = {
  bg: '#ffffff',
  fg: '#171a1f',
  muted: '#5a606b',
  hairline: '#dee2e8',
  signalInfo: '#3b6fb0',
  signalCheck: '#a86b1f',
  signalAttention: '#7c2b2b',
};

export function Frame({
  children,
  variant = 'square',
}: {
  children: React.ReactNode;
  variant?: 'square' | 'story' | 'wide';
}) {
  const padding = variant === 'story' ? 80 : 64;
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: COLORS.bg,
        color: COLORS.fg,
        padding,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Pretendard',
      }}
    >
      {children}
    </div>
  );
}

export function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
      <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: -0.8 }}>{SITE.nameShort}</span>
      <span style={{ fontSize: 16, color: COLORS.muted, letterSpacing: 0 }}>
        {SITE.nameKo}
      </span>
    </div>
  );
}

export function Disclaimer() {
  return (
    <div
      style={{
        borderTop: `1px solid ${COLORS.hairline}`,
        paddingTop: 24,
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontSize: 18,
        color: COLORS.muted,
        lineHeight: 1.45,
      }}
    >
      <span>{SITE.disclaimerShort}</span>
      <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
        <span style={{ color: COLORS.fg, fontWeight: 700 }}>{SITE.team}</span>
        <span>·</span>
        <span>{SITE.domain}</span>
      </div>
    </div>
  );
}
