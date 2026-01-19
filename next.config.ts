import type { NextConfig } from "next";

const nextConfig = {
  // output: 'export', // Removed for Node.js/Vercel deployment
  images: {
    unoptimized: true,
  },
  // trailingSlash: true, // Not strictly needed for Vercel
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
