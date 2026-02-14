import { H1 } from "@mpga/ui"

import { ContactForm } from "./contact-form"

export default function ContactUsPage() {
	return (
		<main className="mx-auto max-w-2xl px-4 py-8">
			<H1 className="mb-4">Contact Us</H1>
			<p className="text-muted-foreground mb-6 text-sm">
				Have a question about the MPGA or one of our events? Send us a message and we will get back
				to you.
			</p>
			<ContactForm />
		</main>
	)
}
