/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["maps.googleapis.com"],
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf2json"],
  },
};

export default nextConfig;
