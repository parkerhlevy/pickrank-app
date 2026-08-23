import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'pickrank.localhost', '*.pickrank.localhost'],
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
