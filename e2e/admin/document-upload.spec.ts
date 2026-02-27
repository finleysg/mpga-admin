import { resolve } from "node:path"

import { expect, test } from "@playwright/test"

import { cleanupTestDocument, closePool } from "../helpers/db"

const DOC_TITLE = "E2E Test Pairings"
const FIXTURE_PDF = resolve(import.meta.dirname, "../fixtures/test-document.pdf")

test.describe("Document upload happy path", () => {
	test.describe.configure({ mode: "serial" })

	test.afterAll(async () => {
		await cleanupTestDocument(DOC_TITLE)
		await closePool()
	})

	test("admin uploads a document to a tournament", async ({ page }) => {
		await page.goto("/tournaments/four-ball", { waitUntil: "domcontentloaded" })
		await expect(page.getByRole("heading", { name: "Four Ball" })).toBeVisible({
			timeout: 15000,
		})

		// Wait for client hydration before interacting with the Documents card
		await page.waitForLoadState("networkidle")

		// Click Add in the Documents card
		const docsHeader = page.locator("[data-slot='card-header']").filter({ hasText: /^Documents/ })
		await expect(docsHeader).toBeVisible({ timeout: 10000 })
		const addBtn = docsHeader.getByRole("button", { name: "Add" })
		await addBtn.click()
		await expect(page.locator("#doc-title")).toBeVisible({ timeout: 10000 })

		// Fill in the form
		await page.fill("#doc-title", DOC_TITLE)

		// Select "Pairings" type
		const editForm = page.locator(".space-y-2.rounded-md.border")
		await editForm.getByRole("combobox").click()
		await page.getByRole("option", { name: "Pairings" }).click()

		// Upload the test PDF
		const fileInput = editForm.locator('input[type="file"]')
		await fileInput.setInputFiles(FIXTURE_PDF)

		// Save
		await editForm.getByRole("button", { name: "Save" }).click()

		// Assert the document appears in the list
		await expect(page.getByText(DOC_TITLE)).toBeVisible({ timeout: 15000 })
		await expect(page.getByText("Pairings")).toBeVisible()
	})

	test("document is visible on the public site", async ({ browser }) => {
		const context = await browser.newContext()
		const page = await context.newPage()

		await page.goto("http://localhost:4000/tournaments/four-ball/2026", {
			waitUntil: "domcontentloaded",
		})

		await expect(page.getByText(DOC_TITLE)).toBeVisible({ timeout: 15000 })

		await context.close()
	})

	test("document appears in admin documents listing", async ({ page }) => {
		await page.goto("/settings/documents", { waitUntil: "domcontentloaded" })
		await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible({
			timeout: 15000,
		})

		// Search for the test document
		await page.getByPlaceholder("Search documents...").fill(DOC_TITLE)

		// Assert the row is visible
		await expect(page.getByRole("cell", { name: DOC_TITLE })).toBeVisible({ timeout: 10000 })
	})

	test("admin deletes the document", async ({ page }) => {
		await page.goto("/tournaments/four-ball", { waitUntil: "domcontentloaded" })
		await expect(page.getByRole("heading", { name: "Four Ball" })).toBeVisible({
			timeout: 15000,
		})

		// Wait for client hydration
		await page.waitForLoadState("networkidle")

		// Find the document item and click the trash/delete button
		const docItem = page.locator("[data-slot='item']").filter({ hasText: DOC_TITLE })
		await expect(docItem).toBeVisible({ timeout: 10000 })
		// The delete button is the last button in the item actions (has the destructive svg)
		await docItem.locator("button").last().click()

		// Confirm deletion in the alert dialog
		const dialog = page.getByRole("alertdialog")
		await expect(dialog).toBeVisible({ timeout: 5000 })
		await dialog.getByRole("button", { name: "Delete" }).click()

		// Assert the document is gone
		await expect(page.getByText(DOC_TITLE)).not.toBeVisible({ timeout: 10000 })
	})

	test("document is no longer visible on the public site", async ({ browser }) => {
		const context = await browser.newContext()
		const page = await context.newPage()

		await page.goto("http://localhost:4000/tournaments/four-ball/2026", {
			waitUntil: "domcontentloaded",
		})

		await expect(page.getByText(DOC_TITLE)).not.toBeVisible({ timeout: 10000 })

		await context.close()
	})
})
