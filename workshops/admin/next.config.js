/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configurar para aceitar conexões da API do backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
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
};

module.exports = nextConfig;

