import type { NextConfig } from "next"

const bucketName = process.env.S3_BUCKET_NAME ?? "mpgagolf"

const nextConfig: NextConfig = {
	output: "standalone",
	transpilePackages: ["@mpga/database", "@mpga/types", "@mpga/ui"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: `${bucketName}.s3.amazonaws.com`,
			},
		],
	},
}

export default nextConfig
