/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

module.exports = {
  // basePath: '/leave',
  // assetPrefix: '/leave',
  outputFileTracing: isVercel,
  experimental: {
    optimizeCss: false,
    disableOptimizedLoading: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};