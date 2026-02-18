import type { NextConfig } from "next"

const bucketName = process.env.S3_BUCKET_NAME ?? "mpgagolf"

const nextConfig: NextConfig = {
	output: "standalone",
	transpilePackages: ["@mpga/database", "@mpga/types", "@mpga/ui"],
	experimental: {
		optimizePackageImports: ["@mpga/ui"],
	},
	images: {
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		remotePatterns: [
			{
				protocol: "https",
				hostname: `${bucketName}.s3.amazonaws.com`,
			},
		],
	},
}

export default nextConfig
