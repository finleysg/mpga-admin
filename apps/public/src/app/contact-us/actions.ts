"use server"

import { isIP } from "node:net"

import type { ActionResult } from "@mpga/types"
import { headers } from "next/headers"

const ADMIN_API_URL =
	process.env.ADMIN_API_URL ?? process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:4100"

export async function submitContactForm(data: {
	contactName: string
	contactEmail: string
	contactPhone: string
	course: string
	message: string
	website: string
	turnstileToken: string
}): Promise<ActionResult> {
	try {
		const secret = process.env.CONTACT_FORM_SECRET
		const ipHeader = process.env.CONTACT_CLIENT_IP_HEADER
		const incoming = await headers()
		// Configure a single-IP header that the ingress proxy overwrites, never
		// a client-supplied forwarding chain. Fail closed if it is unavailable.
		const ip = ipHeader ? incoming.get(ipHeader)?.trim() : null
		if (!secret || !ip || !isIP(ip)) {
			return {
				success: false,
				error: "The contact form is temporarily unavailable. Please try again later.",
			}
		}
		const res = await fetch(`${ADMIN_API_URL}/api/messages`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-contact-secret": secret,
				"x-contact-ip": ip,
			},
			signal: AbortSignal.timeout(20000),
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
