import { type Locator, type Page, expect, test } from "@playwright/test"

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@mpga.net"

test.describe("Audit fields", () => {
	test("club form shows Last updated after save", async ({ page }) => {
		await page.goto("/members/clubs/130", { waitUntil: "domcontentloaded" })
		await expect(page.getByRole("heading", { name: "Edit Club" })).toBeVisible({
			timeout: 15000,
		})

		await page.getByRole("button", { name: "Save" }).click()

		const auditText = page.getByText(/Last updated/)
		await expect(auditText).toBeVisible({ timeout: 15000 })
		await expect(auditText).toContainText(`by ${adminEmail}`)
	})

	test("contact form shows Last updated after save", async ({ page }) => {
		await page.goto("/members/contacts/1047", { waitUntil: "domcontentloaded" })
		await expect(page.getByRole("heading", { name: "Edit Contact" })).toBeVisible({
			timeout: 15000,
		})

		await page.getByRole("button", { name: "Save" }).click()

		const auditText = page.getByText(/Last updated/)
		await expect(auditText).toBeVisible({ timeout: 15000 })
		await expect(auditText).toContainText(`by ${adminEmail}`)
	})
})

test.describe("Club contact audit fields", () => {
	test.describe.configure({ mode: "serial" })

	const today = new Date().toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	})

	async function navigateToClub(page: Page) {
		await page.goto("/members/clubs/130", { waitUntil: "domcontentloaded" })
		await expect(page.getByRole("heading", { name: "Edit Club" })).toBeVisible({
			timeout: 15000,
		})
		const row = page.getByRole("row").filter({ hasText: "Derek White" })
		await row.scrollIntoViewIfNeeded()
		return row
	}

	async function selectRole(page: Page, row: Locator, roleName: string) {
		const combobox = row.getByRole("combobox")
		await combobox.scrollIntoViewIfNeeded()
		await combobox.click()
		// Radix Select dropdown may extend past the viewport; use JS click to bypass checks
		await page.getByRole("option", { name: roleName, exact: true }).evaluate((el) => {
			;(el as HTMLElement).click()
		})
	}

	async function removeRole(row: Locator, roleName: string) {
		// The badge div contains the role text and an X button
		const badge = row.getByText(roleName, { exact: true })
		await badge.getByRole("button").click()
	}

	async function assertAuditUpdated(row: Locator) {
		await expect(row.getByText(today)).toBeVisible({ timeout: 10000 })
		await expect(row.getByText(adminEmail)).toBeVisible()
	}

	test("Last Updated reflects role addition", async ({ page }) => {
		const row = await navigateToClub(page)

		await selectRole(page, row, "Owner")

		// Wait for the badge to render, confirming the server action completed
		await expect(row.getByText("Owner", { exact: true })).toBeVisible({ timeout: 10000 })
		await assertAuditUpdated(row)
	})

	test("Last Updated reflects role removal", async ({ page }) => {
		const row = await navigateToClub(page)

		// Remove the "Owner" role added by the previous test
		await removeRole(row, "Owner")

		await assertAuditUpdated(row)
	})

	test("Last Updated reflects toggling primary contact", async ({ page }) => {
		const row = await navigateToClub(page)

		// Toggle primary status
		await row.getByTitle(/primary/).click()

		await assertAuditUpdated(row)

		// Cleanup: toggle back
		await row.getByTitle(/primary/).click()
	})
})
