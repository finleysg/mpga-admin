"use client"

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Combobox,
	EmptyState,
	toast,
} from "@mpga/ui"
import { Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import {
	type CaptainData,
	type ClubContactOption,
	addTeamCaptainAction,
	listClubContactsAction,
	listTeamCaptainsAction,
	removeTeamCaptainAction,
} from "./actions"

interface CaptainListProps {
	teamId: number
	clubId: number
}

export function CaptainList({ teamId, clubId }: CaptainListProps) {
	const [captains, setCaptains] = useState<CaptainData[]>([])
	const [clubContacts, setClubContacts] = useState<ClubContactOption[]>([])
	const [loading, setLoading] = useState(true)
	const [selectedContactId, setSelectedContactId] = useState("")

	const fetchCaptains = async () => {
		try {
			const result = await listTeamCaptainsAction(teamId)
			if (result.success && result.data) {
				setCaptains(result.data)
			}
		} catch (err) {
			console.error("Failed to fetch captains:", err)
		}
	}

	useEffect(() => {
		async function fetchData() {
			setLoading(true)
			try {
				const [captainsResult, contactsResult] = await Promise.all([
					listTeamCaptainsAction(teamId),
					listClubContactsAction(clubId),
				])

				if (captainsResult.success && captainsResult.data) {
					setCaptains(captainsResult.data)
				}
				if (contactsResult.success && contactsResult.data) {
					setClubContacts(contactsResult.data)
				}
			} catch (err) {
				console.error("Failed to fetch captain data:", err)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [teamId, clubId])

	const handleAdd = async () => {
		if (!selectedContactId) return

		try {
			const result = await addTeamCaptainAction(teamId, parseInt(selectedContactId, 10))
			if (result.success) {
				toast.success("Captain added")
				setSelectedContactId("")
				fetchCaptains()
			} else {
				toast.error(result.error ?? "Failed to add captain")
			}
		} catch {
			toast.error("Failed to add captain")
		}
	}

	const handleRemove = async (id: number) => {
		try {
			const result = await removeTeamCaptainAction(id)
			if (result.success) {
				toast.success("Captain removed")
				fetchCaptains()
			} else {
				toast.error(result.error ?? "Failed to remove captain")
			}
		} catch {
			toast.error("Failed to remove captain")
		}
	}

	// Filter out contacts that are already captains
	const availableContacts = clubContacts.filter(
		(c) => !captains.some((cap) => cap.contactId === c.id),
	)

	if (loading) {
		return null
	}

	return (
		<Card className="mt-6">
			<CardHeader>
				<CardTitle className="font-heading">Team Captains</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{captains.length === 0 ? (
					<EmptyState message="No captains assigned" />
				) : (
					<ul className="divide-y divide-gray-100">
						{captains.map((captain) => (
							<li key={captain.id} className="flex items-center justify-between py-2">
								<div>
									<span className="font-medium">
										{captain.firstName} {captain.lastName}
									</span>
									{captain.email && (
										<span className="ml-2 text-sm text-gray-500">{captain.email}</span>
									)}
									{captain.primaryPhone && (
										<span className="ml-2 text-sm text-gray-500">{captain.primaryPhone}</span>
									)}
								</div>
								<Button variant="ghost" size="icon" onClick={() => handleRemove(captain.id)}>
									<Trash2 className="h-4 w-4 text-red-500" />
								</Button>
							</li>
						))}
					</ul>
				)}

				{/* Add captain */}
				<div className="flex items-end gap-2 border-t pt-4">
					<div className="flex-1">
						<Combobox
							options={availableContacts.map((c) => ({
								value: String(c.id),
								label: `${c.lastName}, ${c.firstName}${c.email ? ` (${c.email})` : ""}`,
							}))}
							value={selectedContactId}
							onValueChange={setSelectedContactId}
							placeholder="Select a contact..."
							searchPlaceholder="Search contacts..."
						/>
					</div>
					<Button variant="secondary" disabled={!selectedContactId} onClick={handleAdd}>
						Add Captain
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
