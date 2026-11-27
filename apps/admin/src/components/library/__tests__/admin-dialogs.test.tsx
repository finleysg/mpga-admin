import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// The dialogs import server actions; they're not called in these tests.
vi.mock("@/app/(dashboard)/library/actions", () => ({
	getFolderAccessAction: vi.fn(),
	setFolderRestrictionAction: vi.fn(),
}))

import { RenameDialog } from "../admin-dialogs"

describe("RenameDialog", () => {
	it("shows the current item's name each time it's opened via the open prop", () => {
		const props = {
			onOpenChange: vi.fn(),
			onDone: vi.fn(),
			title: "Rename folder",
			maxLength: 120,
			save: vi.fn(),
		}
		const { rerender } = render(<RenameDialog {...props} open initialName="Folder A" />)
		const input = () => screen.getByLabelText("Name", { selector: "input" }) as HTMLInputElement
		expect(input().value).toBe("Folder A")
		fireEvent.change(input(), { target: { value: "Edited but not saved" } })

		// Close, then (as when navigating to another folder with the menu still mounted) open
		// again for a different folder. Opening via the prop never calls onOpenChange.
		rerender(<RenameDialog {...props} open={false} initialName="Folder A" />)
		rerender(<RenameDialog {...props} open initialName="Folder B" />)
		expect(input().value).toBe("Folder B")
	})
})
