/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://vismaya-frontend-final.onrender.com",
    NEXT_PUBLIC_USE_MOCK: process.env.NEXT_PUBLIC_USE_MOCK || "false",
    NEXT_PUBLIC_API_MODULES: process.env.NEXT_PUBLIC_API_MODULES || "*",
    NEXT_PUBLIC_MEDIA_UPLOAD_MODE: process.env.NEXT_PUBLIC_MEDIA_UPLOAD_MODE || "backend",
  },
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
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
