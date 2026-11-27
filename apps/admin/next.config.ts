import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	output: "standalone",
	transpilePackages: ["@mpga/database", "@mpga/types", "@mpga/ui"],
	// Library text extraction loads these inside a worker thread at runtime, so they must stay
	// real node_modules packages (not bundled) and be copied into the standalone output.
	serverExternalPackages: ["unpdf", "mammoth", "exceljs"],
	experimental: {
		serverActions: {
			// Library uploads are capped at 5 MB per file (one file per action call). The limit
			// covers the whole multipart body, so leave headroom for its overhead.
			bodySizeLimit: "6mb",
		},
	},
}

export default nextConfig
