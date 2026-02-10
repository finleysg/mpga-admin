"use client"

import { H1, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mpga/ui"
import { useEffect, useState } from "react"

import { type TeamOption, listTeamOptionsAction } from "../actions"
import { ResultForm } from "../result-form"

const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i)

export default function NewResultPage() {
	const [mounted, setMounted] = useState(false)
	const [year, setYear] = useState(currentYear)
	const [teams, setTeams] = useState<TeamOption[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => setMounted(true), [])

	useEffect(() => {
		async function fetchTeams() {
			setLoading(true)
			try {
				const result = await listTeamOptionsAction(year)
				if (result.success && result.data) {
					setTeams(result.data)
				}
			} catch (err) {
				console.error("Failed to fetch teams:", err)
			} finally {
				setLoading(false)
			}
		}

		fetchTeams()
	}, [year])

	return (
		<div className="mx-auto max-w-4xl">
			<H1 variant="secondary" className="mb-6">
				New Result
			</H1>

			{/* Year selector for team filtering */}
			<div className="mb-4 flex items-center gap-2">
				<span className="text-sm font-medium text-gray-700">Teams from year:</span>
				{mounted ? (
					<Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
						<SelectTrigger className="w-28">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{yearOptions.map((y) => (
								<SelectItem key={y} value={String(y)}>
									{y}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<div className="h-9 w-28 rounded-md border bg-transparent" />
				)}
			</div>

			{loading ? (
				<div className="py-8 text-center text-gray-500">Loading teams...</div>
			) : (
				<ResultForm teams={teams} />
			)}
		</div>
	)
}
