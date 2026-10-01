import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  images: { formats: ["image/avif", "image/webp"] },
  poweredByHeader: false,
};

export default nextConfig;
