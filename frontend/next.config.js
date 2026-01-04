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
    // API URL для server-side rewrites - использует обычную переменную окружения
    // (не NEXT_PUBLIC_*), которая читается в runtime, а не на этапе build
    // В Docker это будет 'backend' (имя сервиса), локально 'localhost'
    const apiUrl = process.env.API_URL || 'http://backend:5002';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig
