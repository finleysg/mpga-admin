"use client"

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Input,
} from "@mpga/ui"
import { Plus } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import { addClubContactForContact, searchContactsForContact } from "../../actions"
import type { ContactSearchResult } from "../../types"

interface ContactSearchDialogProps {
	clubId: number
	existingContactIds: number[]
	onContactAdded: () => void
}

export function ContactSearchDialog({
	clubId,
	existingContactIds,
	onContactAdded,
}: ContactSearchDialogProps) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState("")
	const [results, setResults] = useState<ContactSearchResult[]>([])
	const [searching, setSearching] = useState(false)
	const [adding, setAdding] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const doSearch = useCallback(
		async (term: string) => {
			if (!term.trim()) {
				setResults([])
				return
			}

			setSearching(true)
			try {
				const result = await searchContactsForContact(clubId, term)
				if (result.success && result.data) {
					setResults(result.data.filter((c) => !existingContactIds.includes(c.id)))
				}
			} catch (err) {
				console.error("Search failed:", err)
			} finally {
				setSearching(false)
			}
		},
		[clubId, existingContactIds],
	)

	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => doSearch(search), 300)
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, [search, doSearch])

	const handleAdd = async (contactId: number) => {
		setAdding(true)
		setError(null)
		try {
			const result = await addClubContactForContact(clubId, contactId)
			if (result.success) {
				setOpen(false)
				setSearch("")
				setResults([])
				onContactAdded()
			} else {
				setError(result.error ?? "Failed to add contact")
			}
		} catch (err) {
			console.error("Failed to add contact:", err)
			setError("Failed to add contact")
		} finally {
			setAdding(false)
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild>
				<Button type="button" variant="secondary" size="sm">
					<Plus className="mr-1 h-4 w-4" />
					Add Contact
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="font-heading">Search Contacts</AlertDialogTitle>
					<AlertDialogDescription>
						Search by name or email to add a contact to this club.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Input
					placeholder="Search contacts..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					autoFocus
				/>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<div className="max-h-60 overflow-y-auto">
					{searching && <p className="py-2 text-center text-sm text-gray-500">Searching...</p>}
					{!searching && search.trim() && results.length === 0 && (
						<p className="py-2 text-center text-sm text-gray-500">No contacts found</p>
					)}
					{results.map((c) => (
						<button
							key={c.id}
							type="button"
							disabled={adding}
							onClick={() => handleAdd(c.id)}
							className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
						>
							<span className="font-medium">
								{c.firstName} {c.lastName}
							</span>
							{c.email && <span className="ml-2 text-gray-500">{c.email}</span>}
						</button>
					))}
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel>Close</AlertDialogCancel>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
