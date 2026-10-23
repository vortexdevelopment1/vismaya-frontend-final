/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin/cancellations",
        destination: "/admin/cancellation-requests",
        permanent: true,
      },
      {
        source: "/admin/verification",
        destination: "/admin/verifications",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
