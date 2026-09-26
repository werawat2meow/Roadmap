/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.*.*"],
  serverExternalPackages: [
    "geothai",
  ],
  outputFileTracingIncludes: {
    "/recruitment/api/contracts/*/export": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
    "/api/admin/employees/upload-photo": [
      "./node_modules/sharp/**/*",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
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
