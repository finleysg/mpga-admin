import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const importDocumentsBatchAction = vi.fn()
vi.mock("../actions", () => ({
	importDocumentsBatchAction: (...args: unknown[]) => importDocumentsBatchAction(...args),
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { ImportRunner } from "../import-runner"

describe("ImportRunner", () => {
	let finish: (value: unknown) => void

	beforeEach(() => {
		importDocumentsBatchAction.mockReset()
		// The first batch stays in flight until the test finishes it.
		importDocumentsBatchAction.mockImplementation(
			() =>
				new Promise((resolve) => {
					finish = resolve
				}),
		)
	})

	it("closes the confirmation when the import starts and never runs two imports at once", async () => {
		render(<ImportRunner total={372} />)
		fireEvent.click(screen.getByRole("button", { name: "Import 372 documents" }))
		const confirm = screen.getByRole("alertdialog")
		const importButton = screen.getByRole("button", { name: "Import" })

		// A double click on Import fires both before React re-renders.
		await act(async () => {
			fireEvent.click(importButton)
			fireEvent.click(importButton)
		})

		expect(confirm.isConnected).toBe(false)
		expect(screen.queryByRole("alertdialog")).toBeNull()
		expect(importDocumentsBatchAction).toHaveBeenCalledTimes(1)
		expect(screen.getByText(/Working…/)).toBeTruthy()

		// While it runs, the main button is disabled, so no second import can start.
		const main = screen.getByRole("button", { name: /Importing/ })
		expect((main as HTMLButtonElement).disabled).toBe(true)
		fireEvent.click(main)
		expect(screen.queryByRole("alertdialog")).toBeNull()
		expect(importDocumentsBatchAction).toHaveBeenCalledTimes(1)

		await act(async () => {
			finish({
				success: true,
				data: {
					results: [
						{
							documentId: 1,
							title: "Minutes",
							status: "imported",
							fileName: "Minutes.pdf",
							fileId: 1,
						},
					],
					nextAfterDocumentId: null,
				},
			})
		})
		expect(screen.getByText(/Finished\. 1 imported, 0 skipped/)).toBeTruthy()
		expect(
			(screen.getByRole("button", { name: "Import 372 documents" }) as HTMLButtonElement).disabled,
		).toBe(false)
	})
})
