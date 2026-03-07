"use client"

import { EmptyState, H1 } from "@mpga/ui"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import type { TournamentOption } from "@/app/(dashboard)/settings/documents/actions"
import { listTournamentOptionsAction } from "@/app/(dashboard)/settings/documents/actions"
import { DocumentForm } from "@/app/(dashboard)/settings/documents/document-form"
import type { DocumentDataFull } from "@/lib/documents"

import {
	deleteMatchPlayDocumentAction,
	getMatchPlayDocumentAction,
	saveMatchPlayDocumentAction,
	uploadMatchPlayDocumentFileAction,
} from "../actions"

const matchPlayDocumentTypes = ["Match Play", "Match Play Brackets"]

export default function EditMatchPlayDocumentPage() {
	const params = useParams()
	const router = useRouter()
	const [document, setDocument] = useState<DocumentDataFull | null>(null)
	const [tournaments, setTournaments] = useState<TournamentOption[]>([])
	const [loading, setLoading] = useState(true)

	const documentId = Number(params.id)

	useEffect(() => {
		if (isNaN(documentId)) {
			router.push("/match-play/documents")
			return
		}

		async function fetchData() {
			try {
				const [docResult, tournamentsResult] = await Promise.all([
					getMatchPlayDocumentAction(documentId),
					listTournamentOptionsAction(),
				])

				if (!docResult.success || !docResult.data) {
					router.push("/match-play/documents")
					return
				}

				setDocument(docResult.data)
				if (tournamentsResult.success && tournamentsResult.data) {
					setTournaments(tournamentsResult.data)
				}
			} catch (err) {
				console.error("Failed to load document:", err)
				router.push("/match-play/documents")
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
			<H1 variant="secondary">Edit Match Play Document</H1>
			<DocumentForm
				document={document}
				tournaments={tournaments}
				allowedDocumentTypes={matchPlayDocumentTypes}
				basePath="/match-play/documents"
				saveAction={saveMatchPlayDocumentAction}
				deleteAction={deleteMatchPlayDocumentAction}
				uploadAction={uploadMatchPlayDocumentFileAction}
			/>
		</div>
	)
}
