import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	output: "standalone",
	transpilePackages: ["@mpga/database", "@mpga/types", "@mpga/ui"],
	serverExternalPackages: ["nodemailer-mailgun-transport"],
}

export default nextConfig
