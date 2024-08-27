// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
      return [
        {
          source: '/media/:path*',
          destination: '/api/media?path=:path*',
        },
      ];
    },
  };
  
  export default nextConfig;
  