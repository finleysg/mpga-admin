"use client"

import { EmptyState, H1 } from "@mpga/ui"
import { useEffect, useState } from "react"

import { type TournamentOption, listTournamentOptionsAction } from "../actions"
import { DocumentForm } from "../document-form"

export default function NewDocumentPage() {
	const [tournaments, setTournaments] = useState<TournamentOption[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchOptions() {
			try {
				const result = await listTournamentOptionsAction()
				if (result.success && result.data) {
					setTournaments(result.data)
				} else {
					setError(result.error ?? "Failed to load tournament options")
				}
			} catch (err) {
				console.error("Failed to fetch tournaments:", err)
				setError("Failed to load tournament options")
			} finally {
				setLoading(false)
			}
		}

		fetchOptions()
	}, [])

	if (loading) {
		return (
			<div className="mx-auto max-w-6xl">
				<EmptyState message="Loading..." />
			</div>
		)
	}

	if (error) {
		return (
			<div className="mx-auto max-w-6xl">
				<EmptyState message={error} />
			</div>
		)
	}

	return (
		<div className="mx-auto max-w-6xl">
			<H1 variant="secondary" className="mb-6">
				New Document
			</H1>
			<DocumentForm tournaments={tournaments} />
		</div>
	)
}
