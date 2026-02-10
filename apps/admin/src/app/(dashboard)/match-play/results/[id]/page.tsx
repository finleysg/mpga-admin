"use client"

import { H1 } from "@mpga/ui"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
	type ResultData,
	type TeamOption,
	getResultAction,
	listTeamOptionsAction,
} from "../actions"
import { ResultForm } from "../result-form"

export default function EditResultPage() {
	const params = useParams()
	const router = useRouter()
	const [result, setResult] = useState<ResultData | null>(null)
	const [teams, setTeams] = useState<TeamOption[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchData() {
			const id = Number(params.id)
			if (isNaN(id)) {
				router.push("/match-play/results")
				return
			}

			try {
				const resultRes = await getResultAction(id)

				if (!resultRes.success || !resultRes.data) {
					router.push("/match-play/results")
					return
				}

				setResult(resultRes.data)

				const teamsRes = await listTeamOptionsAction(resultRes.data.year)

				if (teamsRes.success && teamsRes.data) {
					setTeams(teamsRes.data)
				}
			} catch (err) {
				console.error("Failed to fetch result:", err)
				router.push("/match-play/results")
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [params.id, router])

	if (loading) {
		return (
			<div className="mx-auto max-w-4xl">
				<div className="py-8 text-center text-gray-500">Loading result...</div>
			</div>
		)
	}

	if (!result) {
		return null
	}

	return (
		<div className="mx-auto max-w-4xl">
			<H1 variant="secondary" className="mb-6">
				Edit Result
			</H1>
			<ResultForm result={result} teams={teams} />
		</div>
	)
}
