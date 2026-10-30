"use server"

import type { ActionResult } from "@mpga/types"
import { revalidatePath } from "next/cache"

import { requireAuth } from "@/lib/require-auth"
import { revalidatePublicSite } from "@/lib/revalidate"
import { copyTournamentSeason, setDisplayedSeason } from "@/lib/tournament-season"

export async function copySeasonAction(): Promise<ActionResult<{ year: number; count: number }>> {
	if (!(await requireAuth())) return { success: false, error: "Unauthorized" }
	try {
		const data = await copyTournamentSeason()
		revalidatePath("/")
		await revalidatePublicSite("/tournaments", "layout")
		return { success: true, data }
	} catch (error) {
		console.error("Failed to copy tournament season:", error)
		return {
			success: false,
			error:
				"Unable to copy the season. All tournaments must have ended and the following season must be empty. Refresh and try again.",
		}
	}
}

export async function setPublicTournamentSeasonAction(year: number): Promise<ActionResult> {
	if (!(await requireAuth())) return { success: false, error: "Unauthorized" }
	if (!Number.isInteger(year) || year < 1900 || year > 9999)
		return { success: false, error: "Invalid season" }
	try {
		await setDisplayedSeason(year)
		revalidatePath("/")
		revalidatePath("/tournaments", "layout")
		await revalidatePublicSite("/tournaments", "layout")
		return { success: true }
	} catch (error) {
		console.error("Failed to change public tournament season:", error)
		return { success: false, error: "Choose a season with tournaments before publishing." }
	}
}
