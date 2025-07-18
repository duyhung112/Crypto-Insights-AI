import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
   env: {
    BYBIT_API_KEY: process.env.BYBIT_API_KEY,
    BYBIT_API_SECRET: process.env.BYBIT_API_SECRET,
  },
};

export default nextConfig;
