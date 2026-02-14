"use server"

import type { ActionResult } from "@mpga/types"

const ADMIN_API_URL =
	process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:4100"

export async function submitContactForm(data: {
	contactName: string
	contactEmail: string
	contactPhone: string
	course: string
	message: string
}): Promise<ActionResult> {
	try {
		const res = await fetch(`${ADMIN_API_URL}/api/messages`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		})

		if (!res.ok) {
			const json = await res.json().catch(() => null)
			return { success: false, error: json?.error ?? "Failed to send message" }
		}

		return { success: true }
	} catch {
		return { success: false, error: "Unable to reach the server. Please try again later." }
	}
}
