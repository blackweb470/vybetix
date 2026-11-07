/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint warnings/errors won't block production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors won't block production builds (tsc runs separately in CI)
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;
