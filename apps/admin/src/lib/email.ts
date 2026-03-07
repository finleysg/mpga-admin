import nodemailer from "nodemailer"
import mailgunTransport from "nodemailer-mailgun-transport"

/**
 * Creates an email transporter based on environment configuration.
 * Uses Mailgun HTTP API in production (when MAILGUN_API_KEY is set),
 * otherwise falls back to local SMTP (Mailpit for development).
 */
function createTransporter() {
	if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
		// Production: Mailgun HTTP API (avoids SMTP port blocking in cloud environments)
		return nodemailer.createTransport(
			mailgunTransport({
				auth: {
					api_key: process.env.MAILGUN_API_KEY,
					domain: process.env.MAILGUN_DOMAIN,
				},
			}),
		)
	}

	// Development / testing SMTP (Mailpit, Mailtrap, etc.)
	const authConfig =
		process.env.MAIL_USER && process.env.MAIL_PASS
			? { auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS } }
			: {}
	return nodemailer.createTransport({
		host: process.env.MAIL_HOST ?? "localhost",
		port: parseInt(process.env.MAIL_PORT ?? "1025", 10),
		secure: false,
		...authConfig,
		connectionTimeout: 5000,
		greetingTimeout: 5000,
		socketTimeout: 10000,
	})
}

const transporter = createTransporter()

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Rewrites a URL's origin to use NEXT_PUBLIC_APP_URL, preserving the path and query.
 * This is needed because Better Auth constructs URLs using BETTER_AUTH_URL, which
 * resolves to the Docker-internal hostname in production.
 */
function rewriteUrlOrigin(url: string): string {
	const appUrl = process.env.NEXT_PUBLIC_ADMIN_URL
	if (!appUrl) return url
	const parsed = new URL(url)
	return `${appUrl.replace(/\/$/, "")}${parsed.pathname}${parsed.search}`
}

/**
 * Wraps email body HTML with consistent branding: MPGA logo, sans-serif font, padding.
 */
function emailLayout(body: string): string {
	const publicUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000"
	const logoUrl = `${publicUrl.replace(/\/$/, "")}/images/mpga-logo.png`
	return `
		<div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
			<div style="margin-bottom: 24px;">
				<img src="${logoUrl}" alt="MPGA" style="max-width: 200px; height: auto;" />
			</div>
			${body}
		</div>
	`
}

/**
 * Sends a magic link email for club contact verification.
 */
export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
	const link = rewriteUrlOrigin(url)
	await transporter.sendMail({
		from: process.env.MAIL_FROM ?? "noreply@mpga.net",
		to: email,
		subject: "MPGA Club Contact Verification",
		text: `Verify your identity to access club contact features.\n\nClick the link below to sign in:\n${link}\n\nThis link expires in 10 minutes.`,
		html: emailLayout(`
			<h1 style="font-size: 22px; color: #333;">Club Contact Verification</h1>
			<p>Verify your identity to access club contact features.</p>
			<p><a href="${link}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 4px;">Click here to sign in</a></p>
			<p style="font-size: 13px; color: #666;">Or copy this link: ${link}</p>
			<p style="font-size: 13px; color: #999;"><em>This link expires in 10 minutes.</em></p>
		`),
	})
}

/**
 * Sends a dues payment confirmation email to all club contacts.
 */
export async function sendDuesPaymentEmail(
	to: string[],
	clubName: string,
	year: number,
): Promise<void> {
	await transporter.sendMail({
		from: process.env.MAIL_FROM ?? "noreply@mpga.net",
		to: to.join(", "),
		subject: `MPGA Dues Payment Confirmation — ${clubName}`,
		text: `This is a confirmation that ${year} MPGA membership dues have been paid for ${clubName}.\n\nThank you for your continued membership in the Minnesota Public Golf Association.`,
		html: emailLayout(`
			<h1 style="font-size: 22px; color: #333;">Dues Payment Confirmation</h1>
			<p>This is a confirmation that <strong>${year}</strong> MPGA membership dues have been paid for <strong>${escapeHtml(clubName)}</strong>.</p>
			<p>Thank you for your continued membership in the Minnesota Public Golf Association.</p>
		`),
	})
}

/**
 * Sends a notification email when a contact form submission is received.
 */
export async function sendContactNotificationEmail(
	name: string,
	email: string,
	phone: string,
	messageText: string,
	course?: string,
): Promise<void> {
	const to = process.env.CONTACT_EMAIL
	if (!to) {
		console.warn("CONTACT_EMAIL not configured — skipping contact notification email")
		return
	}

	const courseLine = course ? `Golf Course: ${escapeHtml(course)}` : ""

	await transporter.sendMail({
		from: process.env.MAIL_FROM ?? "noreply@mpga.net",
		to,
		replyTo: email,
		subject: `MPGA Contact Form: ${name}`,
		text: [
			`Name: ${name}`,
			`Email: ${email}`,
			phone ? `Phone: ${phone}` : "",
			course ? `Golf Course: ${course}` : "",
			"",
			messageText,
		]
			.filter(Boolean)
			.join("\n"),
		html: emailLayout(`
			<h1 style="font-size: 22px; color: #333;">Contact Form Submission</h1>
			<p><strong>Name:</strong> ${escapeHtml(name)}</p>
			<p><strong>Email:</strong> ${escapeHtml(email)}</p>
			${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
			${courseLine ? `<p><strong>${courseLine}</strong></p>` : ""}
			<hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
			<p>${escapeHtml(messageText).replace(/\n/g, "<br />")}</p>
		`),
	})
}

/**
 * Sends captain contact information for a match play group to the requesting captain.
 */
export async function sendCaptainContactsEmail(
	to: string,
	groupName: string,
	year: number,
	captains: Array<{
		firstName: string
		lastName: string
		email: string | null
		primaryPhone: string | null
		alternatePhone: string | null
		clubName: string
	}>,
): Promise<void> {
	const captainRows = captains
		.map((c) => {
			const phones = [c.primaryPhone, c.alternatePhone].filter(Boolean).join(" / ")
			return `
				<tr>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(c.clubName)}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${c.email ? escapeHtml(c.email) : ""}</td>
					<td style="padding: 8px; border-bottom: 1px solid #eee;">${phones ? escapeHtml(phones) : ""}</td>
				</tr>
			`
		})
		.join("")

	const captainText = captains
		.map((c) => {
			const phones = [c.primaryPhone, c.alternatePhone].filter(Boolean).join(" / ")
			return `${c.clubName}: ${c.firstName} ${c.lastName} | ${c.email ?? "N/A"} | ${phones || "N/A"}`
		})
		.join("\n")

	await transporter.sendMail({
		from: process.env.MAIL_FROM ?? "noreply@mpga.net",
		to,
		subject: `MPGA ${year} Match Play Captain Contacts — ${groupName}`,
		text: `Here are the captain contacts for ${groupName} (${year}):\n\n${captainText}`,
		html: emailLayout(`
			<h1 style="font-size: 22px; color: #333;">${year} Match Play Captain Contacts</h1>
			<p>Here are the captain contacts for <strong>${escapeHtml(groupName)}</strong>:</p>
			<table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
				<thead>
					<tr style="background-color: #f5f5f5;">
						<th style="padding: 8px; text-align: left;">Club</th>
						<th style="padding: 8px; text-align: left;">Captain</th>
						<th style="padding: 8px; text-align: left;">Email</th>
						<th style="padding: 8px; text-align: left;">Phone</th>
					</tr>
				</thead>
				<tbody>${captainRows}</tbody>
			</table>
		`),
	})
}

/**
 * Sends an invitation email to the specified address with an accept link.
 */
export async function sendInvitationEmail(email: string, token: string): Promise<void> {
	const appUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:4100"
	const acceptLink = `${appUrl}/accept-invitation/${token}`

	await transporter.sendMail({
		from: process.env.MAIL_FROM ?? "noreply@mpga.net",
		to: email,
		subject: "You've been invited to MPGA Admin",
		text: `You've been invited to join the MPGA Administration site.\n\nClick the link below to create your account:\n${acceptLink}\n\nThis invitation expires in 7 days.`,
		html: emailLayout(`
			<p>You've been invited to join the MPGA Administration site.</p>
			<p><a href="${acceptLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 4px;">Click here to create your account</a></p>
			<p style="font-size: 13px; color: #666;">Or copy this link: ${acceptLink}</p>
			<p style="font-size: 13px; color: #999;"><em>This invitation expires in 7 days.</em></p>
		`),
	})
}
