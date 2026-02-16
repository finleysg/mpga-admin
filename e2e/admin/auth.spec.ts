import { expect, test } from "@playwright/test"

test.describe("Admin auth flow", () => {
	test("unauthenticated access redirects to login", async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" })
		await expect(page).toHaveURL(/\/login/)
	})

	test("login with valid credentials redirects to dashboard", async ({ page }) => {
		const email = process.env.E2E_ADMIN_EMAIL
		const password = process.env.E2E_ADMIN_PASSWORD
		if (!email || !password) {
			test.skip()
			return
		}

		await page.goto("/login", { waitUntil: "domcontentloaded" })
		await page.fill("#email", email)
		await page.fill("#password", password)
		await page.getByRole("button", { name: "Sign in", exact: true }).click()

		await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible({
			timeout: 15000,
		})
	})

	test("login with invalid credentials shows error", async ({ page }) => {
		await page.goto("/login", { waitUntil: "domcontentloaded" })
		await page.fill("#email", "bad@example.com")
		await page.fill("#password", "wrongpassword")
		await page.getByRole("button", { name: "Sign in", exact: true }).click()

		await expect(page.getByText(/failed|invalid|error/i)).toBeVisible({ timeout: 10000 })
	})

	test("sign out redirects to login", async ({ page }) => {
		const email = process.env.E2E_ADMIN_EMAIL
		const password = process.env.E2E_ADMIN_PASSWORD
		if (!email || !password) {
			test.skip()
			return
		}

		// Log in first
		await page.goto("/login", { waitUntil: "domcontentloaded" })
		await page.fill("#email", email)
		await page.fill("#password", password)
		await page.getByRole("button", { name: "Sign in", exact: true }).click()
		await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible({
			timeout: 15000,
		})

		// Sign out and verify session is cleared
		await page.getByRole("button", { name: /sign out|log out/i }).click()
		await page.waitForTimeout(1000)
		await page.goto("/", { waitUntil: "domcontentloaded" })
		await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
	})
})
