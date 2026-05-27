import type { Metadata, Viewport } from 'next';
import './globals.css';

const SITE_NAME = '투표 전 체크';
const SITE_NAME_EN = 'Toocheck';
const SITE_URL = 'https://toocheck.site';
const DESCRIPTION =
  '공개자료를 바탕으로 후보자 정보를 비교해 보여주는 비당파 도구. 후보 지지·반대 의도가 없습니다.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · ${SITE_NAME_EN}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} · ${SITE_NAME_EN}`,
    description: DESCRIPTION,
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
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
