/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ['@resvg/resvg-js'],
};

export default nextConfig;
