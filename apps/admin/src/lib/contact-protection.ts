import { createHash, timingSafeEqual } from "node:crypto"
import { isIP } from "node:net"

import { z } from "zod"

export const contactSchema = z.object({
	contactName: z.string().trim().min(1).max(100),
	contactEmail: z
		.string()
		.trim()
		.email()
		.max(254)
		.transform((s) => s.toLowerCase()),
	contactPhone: z.string().trim().max(20).default(""),
	course: z.string().trim().max(100).default(""),
	message: z.string().trim().min(1).max(5000),
	website: z.string().max(200).default(""),
	turnstileToken: z.string().min(1).max(2048),
})
export type ContactSubmission = z.infer<typeof contactSchema>

export function trustedContactRequest(headers: Headers): boolean {
	const secret = process.env.CONTACT_FORM_SECRET
	const supplied = headers.get("x-contact-secret") ?? ""
	return (
		!!secret &&
		Buffer.byteLength(supplied) === Buffer.byteLength(secret) &&
		timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))
	)
}

export function contactIp(headers: Headers): string | null {
	const ip = headers.get("x-contact-ip") ?? ""
	return isIP(ip) ? ip : null
}

export function contactKey(value: string): string {
	return createHash("sha256").update(value).digest("hex")
}

export async function verifyContactToken(token: string, ip: string): Promise<boolean> {
	const secret = process.env.TURNSTILE_SECRET_KEY
	const hostnames = (process.env.TURNSTILE_HOSTNAMES ?? "mpga.net,www.mpga.net")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean)
	if (!secret || !hostnames.length) return false
	try {
		const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ secret, response: token, remoteip: ip }),
			signal: AbortSignal.timeout(10000),
		})
		if (!response.ok) return false
		const result = await response.json()
		return (
			result.success === true && result.action === "contact" && hostnames.includes(result.hostname)
		)
	} catch {
		return false
	}
}
