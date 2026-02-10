"use client"

import { H1 } from "@mpga/ui"
import { useEffect, useState } from "react"

import { type ClubOption, listClubOptionsAction } from "../actions"
import { TeamForm } from "../team-form"

export default function NewTeamPage() {
	const [clubs, setClubs] = useState<ClubOption[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchClubs() {
			try {
				const result = await listClubOptionsAction()
				if (result.success && result.data) {
					setClubs(result.data)
				}
			} catch (err) {
				console.error("Failed to fetch clubs:", err)
			} finally {
				setLoading(false)
			}
		}

		fetchClubs()
	}, [])

	if (loading) {
		return (
			<div className="mx-auto max-w-4xl">
				<div className="py-8 text-center text-gray-500">Loading...</div>
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-4xl">
			<H1 variant="secondary" className="mb-6">
				New Team
			</H1>
			<TeamForm clubs={clubs} />
		</div>
	)
}
