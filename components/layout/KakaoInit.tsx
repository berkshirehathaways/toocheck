'use client';

import Script from 'next/script';

// 카카오 JS SDK는 NEXT_PUBLIC_KAKAO_JS_KEY가 설정된 경우에만 로드/초기화한다.
// 키가 없으면 이 컴포넌트가 렌더되지 않아 window.Kakao도 없고, ShareButton은
// 카카오 옵션을 숨긴 채 기본 공유·링크 복사로 동작한다.
export function KakaoInit({ jsKey }: { jsKey: string }) {
  return (
    <Script
      src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
      strategy="afterInteractive"
      onLoad={() => {
        const k = window.Kakao as unknown as { isInitialized: () => boolean; init: (key: string) => void } | undefined;
        if (k && !k.isInitialized()) k.init(jsKey);
      }}
    />
  );
}
