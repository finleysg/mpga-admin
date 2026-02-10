"use client"

import { H1 } from "@mpga/ui"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { type ClubOption, type TeamData, getTeamAction, listClubOptionsAction } from "../actions"
import { TeamForm } from "../team-form"

export default function EditTeamPage() {
	const params = useParams()
	const router = useRouter()
	const [team, setTeam] = useState<TeamData | null>(null)
	const [clubs, setClubs] = useState<ClubOption[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchData() {
			const id = Number(params.id)
			if (isNaN(id)) {
				router.push("/match-play/teams")
				return
			}

			try {
				const [teamResult, clubsResult] = await Promise.all([
					getTeamAction(id),
					listClubOptionsAction(),
				])

				if (teamResult.success && teamResult.data) {
					setTeam(teamResult.data)
				} else {
					router.push("/match-play/teams")
					return
				}

				if (clubsResult.success && clubsResult.data) {
					setClubs(clubsResult.data)
				}
			} catch (err) {
				console.error("Failed to fetch team:", err)
				router.push("/match-play/teams")
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [params.id, router])

	if (loading) {
		return (
			<div className="mx-auto max-w-4xl">
				<div className="py-8 text-center text-gray-500">Loading team...</div>
			</div>
		)
	}

	if (!team) {
		return null
	}

	return (
		<div className="mx-auto max-w-4xl">
			<H1 variant="secondary" className="mb-6">
				Edit Team
			</H1>
			<TeamForm team={team} clubs={clubs} />
		</div>
	)
}
