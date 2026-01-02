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
  }
}

module.exports = nextConfig
