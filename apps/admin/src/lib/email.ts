import nodemailer from "nodemailer"

/**
 * Creates an email transporter based on environment configuration.
 * Uses Mailgun SMTP in production (when MAILGUN_API_KEY is set),
 * otherwise falls back to local SMTP (Mailpit for development).
 */
function createTransporter() {
	if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
		// Production: Mailgun SMTP
		return nodemailer.createTransport({
			host: "smtp.mailgun.org",
			port: 587,
			secure: false,
			auth: {
				user: `postmaster@${process.env.MAILGUN_DOMAIN}`,
				pass: process.env.MAILGUN_API_KEY,
			},
		})
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
	})
}

const transporter = createTransporter()

function escapeHtml(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/**
 * Sends a magic link email for club contact verification.
 */
export async function sendMagicLinkEmail(email: string, url: string): Promise<void> {
	await transporter.sendMail({
		from: process.env.MAIL_FROM ?? "noreply@mpga.golf",
		to: email,
		subject: "MPGA Club Contact Verification",
		text: `Verify your identity to access club contact features.\n\nClick the link below to sign in:\n${url}\n\nThis link expires in 10 minutes.`,
		html: `
      <h1>MPGA Club Contact Verification</h1>
      <p>Verify your identity to access club contact features.</p>
      <p><a href="${url}">Click here to sign in</a></p>
      <p>Or copy this link: ${url}</p>
      <p><em>This link expires in 10 minutes.</em></p>
    `,
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
		from: process.env.MAIL_FROM ?? "noreply@mpga.golf",
		to: to.join(", "),
		subject: `MPGA Dues Payment Confirmation — ${clubName}`,
		text: `This is a confirmation that ${year} MPGA membership dues have been paid for ${clubName}.\n\nThank you for your continued membership in the Minnesota Public Golf Association.`,
		html: `
      <h1>Dues Payment Confirmation</h1>
      <p>This is a confirmation that <strong>${year}</strong> MPGA membership dues have been paid for <strong>${escapeHtml(clubName)}</strong>.</p>
      <p>Thank you for your continued membership in the Minnesota Public Golf Association.</p>
    `,
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
		from: process.env.MAIL_FROM ?? "noreply@mpga.golf",
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
		html: `
      <h1>MPGA Contact Form Submission</h1>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
      ${courseLine ? `<p><strong>${courseLine}</strong></p>` : ""}
      <hr />
      <p>${escapeHtml(messageText).replace(/\n/g, "<br />")}</p>
    `,
	})
}

/**
 * Sends an invitation email to the specified address with an accept link.
 */
export async function sendInvitationEmail(email: string, token: string): Promise<void> {
	const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4100"
	const acceptLink = `${appUrl}/accept-invitation/${token}`

	await transporter.sendMail({
		from: process.env.MAIL_FROM ?? "noreply@mpga.golf",
		to: email,
		subject: "You've been invited to MPGA Admin",
		text: `You've been invited to join the MPGA Administration site.\n\nClick the link below to create your account:\n${acceptLink}\n\nThis invitation expires in 7 days.`,
		html: `
      <h1>You've been invited to MPGA Administration</h1>
      <p>You've been invited to join the MPGA Administration site.</p>
      <p><a href="${acceptLink}">Click here to create your account</a></p>
      <p>Or copy this link: ${acceptLink}</p>
      <p><em>This invitation expires in 7 days.</em></p>
    `,
	})
}
