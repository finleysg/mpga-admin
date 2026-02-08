import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	output: "standalone",
	transpilePackages: ["@mpga/database", "@mpga/types", "@mpga/ui"],
}

export default nextConfig
