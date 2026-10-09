// apps/web/next.config.ts

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from our backend (localhost:4000) and any production URL.
  // Uses remotePatterns (Next 13+ safe approach).
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      // Production — set your domain in env, or add here.
      // {
      //   protocol: 'https',
      //   hostname: 'your-domain.com',
      //   pathname: '/uploads/**',
      // },
    ],
  },

  // Strict React mode — surfaces bugs early.
  reactStrictMode: true,

  // TypeScript & ESLint build-time checks
  typescript: {
    ignoreBuildErrors: false,
  },
  // Transpile workspace packages.
  transpilePackages: ['@inventory/types', '@inventory/validation'],
};

export default nextConfig;
