"use server"

import type { ActionResult } from "@mpga/types"

import { db } from "@/lib/db"
import { importBatch, type ImportBatch } from "@/lib/library/import-documents"
import { getLibraryStorage } from "@/lib/library/storage"
import { requireSuperAdmin } from "@/lib/require-auth"

/** Import the next batch of existing documents into the library. Super admins only. */
export async function importDocumentsBatchAction(
	afterDocumentId: number,
): Promise<ActionResult<ImportBatch>> {
	const userId = await requireSuperAdmin()
	if (!userId) return { success: false, error: "Unauthorized" }
	try {
		const data = await importBatch(
			db,
			getLibraryStorage(),
			{ id: userId, isDocumentAdmin: true },
			{
				afterDocumentId,
			},
		)
		return { success: true, data }
	} catch (error) {
		console.error("Document import batch failed:", error)
		return { success: false, error: "The import stopped with an error. It's safe to run again." }
	}
}
