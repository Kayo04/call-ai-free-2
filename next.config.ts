import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb', // ⚠️ Aumenta o limite de 1MB para 4MB
    },
  },
  // Se já tiveres outras configs (como imagens), mantém-nas aqui
};

export default nextConfig;