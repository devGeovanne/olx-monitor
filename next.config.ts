import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mantém simples e estável para deploy
  reactStrictMode: true,

  // Se você não usa imagens remotas, pode remover isso.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.olx.com.br" },
      { protocol: "https", hostname: "df.olx.com.br" }
    ]
  }
};

export default nextConfig;
