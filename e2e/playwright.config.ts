import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { defineConfig, devices } from "@playwright/test"

// Load e2e/.env if it exists
const envPath = resolve(import.meta.dirname, ".env")
if (existsSync(envPath)) {
	for (const line of readFileSync(envPath, "utf-8").split("\n")) {
		const match = line.match(/^\s*([\w]+)\s*=\s*(.*)$/)
		if (match) {
			process.env[match[1]!] = match[2]!.trim()
		}
	}
}

export default defineConfig({
	globalSetup: resolve(import.meta.dirname, "global-setup.ts"),
	globalTimeout: 300_000,
	testDir: ".",
	testMatch: "**/*.spec.ts",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: [["html", { outputFolder: "playwright-report" }]],
	outputDir: "test-results",

	timeout: 60_000,

	use: {
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		navigationTimeout: 45_000,
	},

	projects: [
		{
			name: "auth-setup",
			testMatch: "auth.setup.ts",
		},
		{
			name: "public",
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:4000",
			},
			testDir: "public",
		},
		{
			name: "admin",
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:4100",
				storageState: resolve(import.meta.dirname, ".auth/admin.json"),
			},
			testDir: "admin",
			testIgnore: ["auth.spec.ts", "invitation.spec.ts"],
			dependencies: ["auth-setup"],
		},
		{
			name: "admin-auth",
			use: {
				...devices["Desktop Chrome"],
				baseURL: "http://localhost:4100",
			},
			testDir: "admin",
			testMatch: ["auth.spec.ts", "invitation.spec.ts"],
		},
	],
})
