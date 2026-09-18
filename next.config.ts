// next.config.ts — replace entire file
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Trailing slash makes routing cleaner on Vercel
  trailingSlash: false,

  // Images: allow external sources if you add any later
  images: {
    unoptimized: false,
  },
};

export default nextConfig;