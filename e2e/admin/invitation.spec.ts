import { expect, test } from "@playwright/test"

import { cleanupTestUser, closePool, seedInvitation } from "../helpers/db"

const SUPER_ADMIN_ID = "3vwDTBhTYTNgLgoNglfU1Jv2XwBartmv"

test.describe.serial("Invitation acceptance flow", () => {
	const testEmail = `e2e-test-${Date.now()}@example.com`
	const testPassword = "TestPassword123!"
	const testName = "E2E Test User"
	let plainToken: string

	test.beforeAll(async () => {
		plainToken = await seedInvitation(testEmail, SUPER_ADMIN_ID)
	})

	test.afterAll(async () => {
		await cleanupTestUser(testEmail)
		await closePool()
	})

	test("accept invitation and create account", async ({ page }) => {
		// Navigate to the invitation acceptance page
		await page.goto(`/accept-invitation/${plainToken}`, { waitUntil: "domcontentloaded" })

		// Verify the form loaded (CardTitle renders as a div, not a heading)
		await expect(page.getByText("Create your account")).toBeVisible({
			timeout: 15000,
		})

		// Verify email is pre-filled and readonly
		const emailInput = page.locator("#email")
		await expect(emailInput).toHaveValue(testEmail)
		await expect(emailInput).toHaveAttribute("readonly", "")

		// Fill in name and password, submit
		await page.fill("#name", testName)
		await page.fill("#password", testPassword)
		await page.getByRole("button", { name: "Create account" }).click()

		// After account creation, the user is redirected to the dashboard
		await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible({
			timeout: 15000,
		})

		// Verify access to a protected page
		await page.goto("/members/clubs", { waitUntil: "domcontentloaded" })
		await expect(page.getByRole("heading", { name: /clubs/i })).toBeVisible({
			timeout: 15000,
		})
	})

	test("invalid token shows error", async ({ page }) => {
		await page.goto("/accept-invitation/invalid-token-abc123", { waitUntil: "domcontentloaded" })

		// CardTitle renders as a div, not a heading
		await expect(page.getByText("Invalid Invitation")).toBeVisible({
			timeout: 15000,
		})
	})
})
