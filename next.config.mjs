/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // NEC 후보 사진 CDN (deep-link). 선거기간 동안 안전, 선거 후 자체 미러 검토.
      { protocol: 'http', hostname: 'cdn.nec.go.kr' },
      { protocol: 'https', hostname: 'cdn.nec.go.kr' },
    ],
  },
  serverExternalPackages: ['@resvg/resvg-js'],
};

export default nextConfig;
