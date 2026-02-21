import { expect, test } from "@playwright/test"

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
