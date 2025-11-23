import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverExternalPackages: ['pdf-parse'],
  },
};

export default nextConfig;
