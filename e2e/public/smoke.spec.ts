import { expect, test } from "@playwright/test"

test.describe("Public site smoke tests", () => {
	test("home page loads and shows MPGA heading", async ({ page }) => {
		await page.goto("/")
		await expect(page.getByRole("link", { name: "MPGA" })).toBeVisible()
	})

	test("about us page loads", async ({ page }) => {
		await page.goto("/about-us")
		await expect(page.locator("h1")).toBeVisible()
	})

	test("tournaments page loads", async ({ page }) => {
		await page.goto("/tournaments")
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
	})

	test("contact us page loads", async ({ page }) => {
		await page.goto("/contact-us")
		await expect(page.getByRole("heading", { name: "Contact Us" })).toBeVisible()
	})
})
