import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	output: "standalone",
	transpilePackages: ["@mpga/database", "@mpga/types", "@mpga/ui"],
	experimental: {
		serverActions: {
			// Library uploads are capped at 5 MB per file (one file per action call). The limit
			// covers the whole multipart body, so leave headroom for its overhead.
			bodySizeLimit: "6mb",
		},
	},
}

export default nextConfig
