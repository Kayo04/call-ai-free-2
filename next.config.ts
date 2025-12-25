import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // ⚠️ Aumentámos para 10MB para caberem fotos originais
    },
  },
};

export default nextConfig;