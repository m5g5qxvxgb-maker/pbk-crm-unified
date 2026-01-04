/** @type {import('next').NextConfig} */
const nextConfig = {
  // Разрешить доступ из сети
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    }
  },
  typescript: {
    ignoreBuildErrors: true
  },
  async rewrites() {
    // Получаем API URL из переменной окружения
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5002';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
