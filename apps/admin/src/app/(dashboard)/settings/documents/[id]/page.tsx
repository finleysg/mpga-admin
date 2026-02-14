"use client"

import { EmptyState, H1 } from "@mpga/ui"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import {
	type DocumentData,
	type TournamentOption,
	getDocumentAction,
	listTournamentOptionsAction,
} from "../actions"
import { DocumentForm } from "../document-form"

export default function EditDocumentPage() {
	const params = useParams()
	const router = useRouter()
	const [document, setDocument] = useState<DocumentData | null>(null)
	const [tournaments, setTournaments] = useState<TournamentOption[]>([])
	const [loading, setLoading] = useState(true)

	const documentId = Number(params.id)

	useEffect(() => {
		if (isNaN(documentId)) {
			router.push("/settings/documents")
			return
		}

		async function fetchData() {
			try {
				const [docResult, tournamentsResult] = await Promise.all([
					getDocumentAction(documentId),
					listTournamentOptionsAction(),
				])

				if (!docResult.success || !docResult.data) {
					router.push("/settings/documents")
					return
				}

				setDocument(docResult.data)
				if (tournamentsResult.success && tournamentsResult.data) {
					setTournaments(tournamentsResult.data)
				}
			} catch (err) {
				console.error("Failed to load document:", err)
				router.push("/settings/documents")
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [documentId, router])

	if (loading) {
		return (
			<div className="mx-auto max-w-6xl">
				<EmptyState message="Loading document..." />
			</div>
		)
	}

	if (!document) {
		return null
	}

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<H1 variant="secondary">Edit Document</H1>
			<DocumentForm document={document} tournaments={tournaments} />
		</div>
	)
}
