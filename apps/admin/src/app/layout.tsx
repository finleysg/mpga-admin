import { Toaster } from "@mpga/ui"
import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"

import { PostHogProvider } from "./posthog-provider"
import "./globals.css"

const playfair = Playfair_Display({
	subsets: ["latin"],
	variable: "--font-heading",
	display: "swap",
})

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-body",
	display: "swap",
})

export const metadata: Metadata = {
	title: "MPGA Admin",
	description: "Admin dashboard",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${playfair.variable} ${inter.variable}`}>
			<body className="min-h-screen bg-gray-50 font-body antialiased">
				<PostHogProvider>
					{children}
					<Toaster />
				</PostHogProvider>
			</body>
		</html>
	)
}
