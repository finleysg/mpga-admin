"use client"

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@mpga/ui"
import { Pencil, Star, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { ContactEditDialog } from "./contact-edit-dialog"
import { ContactSearchDialog } from "./contact-search-dialog"
import {
	addClubContactRoleForContact,
	listClubContactsForContact,
	removeClubContactForContact,
	removeClubContactRoleForContact,
	toggleClubContactPrimaryForContact,
} from "../../actions"
import type { ClubContactData } from "../../types"

const PREDEFINED_ROLES = [
	"Clubhouse Manager",
	"Director of Golf",
	"Event Director",
	"General Manager",
	"Handicap Chair",
	"Manager",
	"Match Play Captain",
	"Men's Club Contact",
	"Men's Club President",
	"Men's Club Secretary",
	"Men's Club Tournament Chair",
	"Men's Club Treasurer",
	"Men's Club VP",
	"Owner",
	"PGA Professional",
	"Pro Shop Manager",
	"Sr. Match Play Captain",
	"Superintendent",
]

interface ClubContactsSectionProps {
	clubId: number
	initialContacts: ClubContactData[]
}

export function ClubContactsSection({ clubId, initialContacts }: ClubContactsSectionProps) {
	const [mounted, setMounted] = useState(false)
	const [contacts, setContacts] = useState<ClubContactData[]>(initialContacts)
	const [removing, setRemoving] = useState<number | null>(null)
	const [editingContact, setEditingContact] = useState<ClubContactData | null>(null)

	useEffect(() => setMounted(true), [])

	const refreshContacts = useCallback(async () => {
		try {
			const result = await listClubContactsForContact(clubId)
			if (result.success && result.data) {
				setContacts(result.data)
			}
		} catch (err) {
			console.error("Failed to refresh contacts:", err)
		}
	}, [clubId])

	const handleRemoveContact = async (clubContactId: number) => {
		setRemoving(clubContactId)
		try {
			const result = await removeClubContactForContact(clubId, clubContactId)
			if (result.success) {
				toast.success("Contact removed")
				await refreshContacts()
			} else {
				toast.error(result.error ?? "Failed to remove contact")
			}
		} catch (err) {
			console.error("Failed to remove contact:", err)
			toast.error("Failed to remove contact")
		} finally {
			setRemoving(null)
		}
	}

	const handleAddRole = async (clubContactId: number, role: string) => {
		try {
			const result = await addClubContactRoleForContact(clubId, clubContactId, role)
			if (result.success) {
				await refreshContacts()
			} else {
				toast.error(result.error ?? "Failed to add role")
			}
		} catch (err) {
			console.error("Failed to add role:", err)
			toast.error("Failed to add role")
		}
	}

	const handleRemoveRole = async (roleId: number) => {
		try {
			const result = await removeClubContactRoleForContact(clubId, roleId)
			if (result.success) {
				await refreshContacts()
			} else {
				toast.error(result.error ?? "Failed to remove role")
			}
		} catch (err) {
			console.error("Failed to remove role:", err)
			toast.error("Failed to remove role")
		}
	}

	const handleTogglePrimary = async (clubContactId: number) => {
		try {
			const result = await toggleClubContactPrimaryForContact(clubId, clubContactId)
			if (result.success) {
				toast.success("Primary contact updated")
				await refreshContacts()
			} else {
				toast.error(result.error ?? "Failed to update primary contact")
			}
		} catch (err) {
			console.error("Failed to toggle primary:", err)
			toast.error("Failed to update primary contact")
		}
	}

	const existingContactIds = contacts.map((c) => c.contactId)

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle className="font-heading text-xl">Club Contacts</CardTitle>
				<ContactSearchDialog
					clubId={clubId}
					existingContactIds={existingContactIds}
					onContactAdded={refreshContacts}
				/>
			</CardHeader>
			<CardContent>
				{contacts.length === 0 ? (
					<p className="text-sm text-gray-500">No contacts added to this club yet.</p>
				) : (
					<div className="space-y-3">
						{contacts.map((cc) => {
							const assignedRoles = cc.roles.map((r) => r.role)
							const availableRoles = PREDEFINED_ROLES.filter((r) => !assignedRoles.includes(r))

							return (
								<div key={cc.clubContactId} className="rounded-lg border p-4">
									<div className="flex items-start justify-between gap-2">
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => handleTogglePrimary(cc.clubContactId)}
												className="shrink-0 rounded p-0.5 hover:bg-gray-100"
												title={cc.isPrimary ? "Remove primary" : "Set as primary"}
											>
												<Star
													className={`h-5 w-5 ${cc.isPrimary ? "text-yellow-500" : "text-gray-300"}`}
													fill={cc.isPrimary ? "currentColor" : "none"}
												/>
											</button>
											<div>
												<button
													type="button"
													onClick={() => setEditingContact(cc)}
													className="flex items-center gap-1 text-sm font-medium hover:underline"
												>
													{cc.firstName} {cc.lastName}
													<Pencil className="h-3 w-3 text-gray-400" />
												</button>
												{cc.email && <p className="text-muted-foreground text-xs">{cc.email}</p>}
												{cc.primaryPhone && (
													<p className="text-muted-foreground text-xs">{cc.primaryPhone}</p>
												)}
											</div>
										</div>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													disabled={removing === cc.clubContactId}
												>
													<Trash2 className="h-4 w-4 text-red-500" />
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Remove Contact</AlertDialogTitle>
													<AlertDialogDescription>
														Remove {cc.firstName} {cc.lastName} from this club? The contact record
														itself will not be deleted.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction
														onClick={(e) => {
															e.preventDefault()
															handleRemoveContact(cc.clubContactId)
														}}
														className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
													>
														Remove
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>

									<div className="mt-3 flex flex-wrap items-center gap-1">
										{cc.roles.map((role) => (
											<Badge
												key={role.id}
												variant="outline"
												className="gap-1 border-secondary-200 bg-secondary-100 pr-1"
											>
												{role.role}
												<button
													type="button"
													onClick={() => handleRemoveRole(role.id)}
													className="ml-0.5 rounded-full p-0.5 hover:bg-gray-200"
												>
													<X className="h-3 w-3" />
												</button>
											</Badge>
										))}
										{availableRoles.length > 0 && mounted && (
											<Select
												value=""
												onValueChange={(value) => handleAddRole(cc.clubContactId, value)}
											>
												<SelectTrigger className="h-7 w-35 text-xs">
													<SelectValue placeholder="Add role..." />
												</SelectTrigger>
												<SelectContent>
													{availableRoles.map((role) => (
														<SelectItem key={role} value={role}>
															{role}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										)}
									</div>
									{cc.updateDate && (
										<p className="text-muted-foreground mt-2 text-xs">
											Updated{" "}
											{new Date(cc.updateDate.replace(" ", "T")).toLocaleString("en-US", {
												year: "numeric",
												month: "short",
												day: "numeric",
												hour: "numeric",
												minute: "2-digit",
											})}
										</p>
									)}
								</div>
							)
						})}
					</div>
				)}
			</CardContent>
			<ContactEditDialog
				clubId={clubId}
				contact={editingContact}
				open={editingContact !== null}
				onOpenChange={(open) => {
					if (!open) setEditingContact(null)
				}}
				onSaved={refreshContacts}
			/>
		</Card>
	)
}
