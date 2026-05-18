/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // Legacy /sales/* paths continue to land on /agent/* during the rename window.
      { source: '/sales/:path*', destination: '/agent/:path*', permanent: false },
    ];
  },
};

export default nextConfig;
