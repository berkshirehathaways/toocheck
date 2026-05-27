import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { SITE } from '@/lib/site/config';
import { SiteHeader } from '@/components/layout/Header';
import { SiteFooter } from '@/components/layout/Footer';
import './globals.css';

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display-en',
});

const mono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const body = Space_Grotesk({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const TITLE = `${SITE.nameKo} · ${SITE.nameEn}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: TITLE,
    template: `%s · ${SITE.nameKo}`,
  },
  description: SITE.disclaimerLong,
  applicationName: SITE.nameKo,
  keywords: ['선거', '후보자', '공개자료', '비당파', '비교'],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE.url,
    siteName: SITE.nameKo,
    title: TITLE,
    description: SITE.disclaimerShort,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: SITE.disclaimerShort,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#050505',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${bebas.variable} ${mono.variable} ${body.variable}`}
    >
      <body className="flex min-h-screen flex-col bg-bg text-ink antialiased">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
