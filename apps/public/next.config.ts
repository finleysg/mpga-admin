import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@mpga/database", "@mpga/types", "@mpga/ui"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mpgagolf.s3.us-west-2.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
