import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Nota: ignoreBuildErrors foi removido. Todos os erros de TS agora
  // serao tratados durante o build. Variaveis de ambiente do Supabase
  // sao carregadas via Vercel Environment Variables (projeto -> Settings -> Environment Variables).
};

export default nextConfig;
