import { resolve } from "node:path"

import { expect, test as setup } from "@playwright/test"

const AUTH_FILE = resolve(import.meta.dirname, ".auth/admin.json")

setup("authenticate as admin", async ({ page }) => {
	const email = process.env.E2E_ADMIN_EMAIL
	const password = process.env.E2E_ADMIN_PASSWORD
	if (!email || !password) {
		throw new Error("E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD must be set in e2e/.env")
	}

	await page.goto("http://localhost:4100/login", { waitUntil: "domcontentloaded" })
	await page.fill("#email", email)
	await page.fill("#password", password)
	await page.getByRole("button", { name: "Sign in", exact: true }).click()

	await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible({
		timeout: 15000,
	})

	await page.context().storageState({ path: AUTH_FILE })
})
