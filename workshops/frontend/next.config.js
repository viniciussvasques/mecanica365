/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  },
  // Configuração para resolver problemas de I/O no Docker/Windows
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000, // Verifica mudanças a cada 1 segundo
        aggregateTimeout: 300, // Espera 300ms antes de recompilar
        ignored: /node_modules/,
      };
    }
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
}


module.exports = nextConfig

