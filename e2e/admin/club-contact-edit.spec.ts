import { expect, test } from "@playwright/test"

import { cleanupClubContact, closePool, seedClubContact } from "../helpers/db"

const CLUB_ID = 130
const SYSTEM_NAME = "albion-ridges"
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin@mpga.net"

test.describe("Club contact edit page", () => {
	test.beforeAll(async () => {
		await seedClubContact(CLUB_ID, adminEmail)
	})

	test.afterAll(async () => {
		await cleanupClubContact(adminEmail)
		await closePool()
	})

	test("mpga.net link points to the specific club page", async ({ page }) => {
		await page.goto(`/club-contact/edit-club/${CLUB_ID}`, { waitUntil: "domcontentloaded" })

		await expect(page.getByText(`Edit Albion Ridges`)).toBeVisible({ timeout: 15000 })

		const link = page.getByRole("link", { name: /mpga\.net/ })
		await expect(link).toBeVisible()
		await expect(link).toHaveAttribute("href", new RegExp(`/members/${SYSTEM_NAME}$`))
	})
})
