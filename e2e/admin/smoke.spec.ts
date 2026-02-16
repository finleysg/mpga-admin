import { expect, test } from "@playwright/test"

test.describe("Admin site smoke tests", () => {
	test("dashboard loads and shows heading", async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" })
		await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible()
	})

	test("sidebar navigation links are visible", async ({ page }) => {
		await page.goto("/", { waitUntil: "domcontentloaded" })
		const groupLabels = page.locator('[data-sidebar="group-label"]')
		await expect(groupLabels.getByText("Tournaments")).toBeVisible()
		await expect(groupLabels.getByText("Members")).toBeVisible()
		await expect(groupLabels.getByText("Match Play")).toBeVisible()
	})

	test("navigate to clubs page", async ({ page }) => {
		await page.goto("/members/clubs", { waitUntil: "domcontentloaded" })
		await expect(page.getByRole("heading", { name: "Clubs" })).toBeVisible()
	})
})
