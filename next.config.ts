import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  logging: { incomingRequests: { ignore: [/\/account-deletion\/confirm(?:[/?]|$)/] } },
  async headers() {
    return [{ source: '/account-deletion/:path*', headers: [
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      { key: 'Cache-Control', value: 'no-store' },
    ] }];
  },
  async redirects() {
    return [
      { source: '/status', destination: '/', permanent: false },
      { source: '/ai-interview', destination: '/interviews/new', permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
