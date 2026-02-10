"use client"

import { H1 } from "@mpga/ui"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { type AnnouncementData, getAnnouncementAction } from "../actions"
import { AnnouncementForm } from "../announcement-form"

export default function EditAnnouncementPage() {
	const params = useParams()
	const router = useRouter()
	const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchData() {
			const id = Number(params.id)
			if (isNaN(id)) {
				router.push("/content/news")
				return
			}

			try {
				const result = await getAnnouncementAction(id)

				if (result.success && result.data) {
					setAnnouncement(result.data)
				} else {
					router.push("/content/news")
					return
				}
			} catch (err) {
				console.error("Failed to fetch announcement:", err)
				router.push("/content/news")
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [params.id, router])

	if (loading) {
		return (
			<div className="mx-auto max-w-4xl">
				<div className="py-8 text-center text-gray-500">Loading announcement...</div>
			</div>
		)
	}

	if (!announcement) {
		return null
	}

	return (
		<div className="mx-auto max-w-4xl">
			<H1 variant="secondary" className="mb-6">
				Edit Announcement
			</H1>
			<AnnouncementForm announcement={announcement} />
		</div>
	)
}
