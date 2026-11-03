import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];

// Stores and products should show up on Google; a shopper's cart, checkout and
// order pages (which hold names, phones and addresses) and the API should not.
// A header does this without listing the paths in robots.txt.
const noIndex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/api/:path*', headers: noIndex },
      { source: '/:slug/cart', headers: noIndex },
      { source: '/:slug/checkout/:path*', headers: noIndex },
      { source: '/:slug/order/:path*', headers: noIndex },
    ];
  },
};

export default nextConfig;
