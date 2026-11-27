import type { ActionResult } from "@mpga/types"

import type { UploadedFile } from "./service"

// Types used by library server actions. They live here because "use server" files can't export
// types under Turbopack.

export type UploadActionResult = ActionResult<UploadedFile> & {
	/** Set when a file with the same name exists and the member must choose what to do. */
	conflict?: { existingFileId: number }
}
