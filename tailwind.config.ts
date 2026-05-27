import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'var(--font-body)',
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'var(--font-display-en)',
          'Bebas Neue',
          'Rajdhani',
          'sans-serif',
        ],
        ko: [
          'Pretendard Variable',
          'Pretendard',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'JetBrains Mono',
          'ui-monospace',
          'monospace',
        ],
        serif: ['Fraunces', 'Iowan Old Style', 'Georgia', 'serif'],
      },
      fontSize: {
        base: ['15px', '1.6'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        cyan: {
          DEFAULT: '#06b6d4',
          glow: 'rgba(6,182,212,0.4)',
        },
        lime: {
          DEFAULT: '#bef264',
          glow: 'rgba(190,242,100,0.4)',
        },
        ink: '#F3F4F6',
        dim: 'rgba(243,244,246,0.55)',
        faint: 'rgba(243,244,246,0.10)',
        hair: 'rgba(255,255,255,0.10)',
        'hair-soft': 'rgba(255,255,255,0.06)',
        bg: {
          DEFAULT: '#050505',
          elev: '#0c0d10',
        },
        signal: {
          info: '#3b6fb0',
          check: '#a86b1f',
          attention: '#7c2b2b',
        },
      },
      borderRadius: {
        none: '0',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) + 2px)',
        sm: 'calc(var(--radius) + 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
