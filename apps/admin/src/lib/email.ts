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

	// Development: Local SMTP (Mailpit)
	return nodemailer.createTransport({
		host: process.env.MAIL_HOST ?? "localhost",
		port: parseInt(process.env.MAIL_PORT ?? "1025", 10),
		secure: false,
	})
}

const transporter = createTransporter()

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
