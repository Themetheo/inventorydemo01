/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: new URL(".", import.meta.url).pathname,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:4000/:path*",
      },
    ];
  },
};

export default nextConfig;
