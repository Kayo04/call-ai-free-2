import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // ⚠️ Aumentamos o limite para 4MB (o máximo seguro da Vercel)
    },
  },
};

export default nextConfig;