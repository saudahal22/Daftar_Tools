/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'minio',
        port: '9000',
        pathname: '/tool-icons/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/tool-icons/**',
      },
      {
        // Allow any image for development
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;
