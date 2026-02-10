"use client"

import { H1 } from "@mpga/ui"

import { AnnouncementForm } from "../announcement-form"

export default function NewAnnouncementPage() {
	return (
		<div className="mx-auto max-w-4xl">
			<H1 variant="secondary" className="mb-6">
				New Announcement
			</H1>
			<AnnouncementForm />
		</div>
	)
}
