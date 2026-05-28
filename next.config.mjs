/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.*.*"],
  async rewrites() {
    return [
      {
        source: '/leave/_next/:path*',
        destination: 'http://localhost:3001/leave/_next/:path*',
      },
      {
        source: '/leave/:path*',
        destination: 'http://localhost:3001/leave/:path*',  // ← เปลี่ยนกลับ
      },
    ];
  },
};

export default nextConfig;