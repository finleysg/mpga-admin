import { club } from "@mpga/database"
import { eq } from "drizzle-orm"

import { db } from "@/lib/db"

export async function revalidateClubPage(clubId: number) {
	const [row] = await db
		.select({ systemName: club.systemName })
		.from(club)
		.where(eq(club.id, clubId))
	if (row) await revalidatePublicSite(`/members/${row.systemName}`)
}

export async function revalidatePublicSite(path: string, type?: "page" | "layout") {
	const publicUrl = process.env.PUBLIC_SITE_URL
	const secret = process.env.REVALIDATE_SECRET

	if (!publicUrl || !secret) {
		console.warn("PUBLIC_SITE_URL or REVALIDATE_SECRET not configured, skipping revalidation")
		return
	}

	try {
		const url = `${publicUrl}/api/revalidate?path=${encodeURIComponent(path)}${type ? `&type=${type}` : ""}`
		const res = await fetch(url, {
			method: "POST",
			signal: AbortSignal.timeout(5000),
			headers: { "x-revalidate-secret": secret },
		})
		if (!res.ok) {
			console.error(`Revalidation failed: ${res.status} ${res.statusText}`)
		}
	} catch (error) {
		console.error("Failed to revalidate public site:", error)
	}
}
