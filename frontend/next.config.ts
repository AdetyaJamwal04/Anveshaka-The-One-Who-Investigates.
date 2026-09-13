import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.20.10.2', '192.168.29.103', '172.23.64.1', '127.0.0.1', 'localhost'],
};

export default nextConfig;