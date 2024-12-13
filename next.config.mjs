/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "via.placeholder.com",
      "api.pexels.com",
      "images.pexels.com",
      "unsplash.com",
    ],
  },
  experimental: {
    esmExternals: true,
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://quranapi.pages.dev/api/:path*", // The API endpoint
      },
    ];
  },
};

export default nextConfig;
