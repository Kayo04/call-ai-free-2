import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Aumentei para 5MB para ser seguro
    },
  },
};

export default nextConfig;