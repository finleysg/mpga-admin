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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@mpga/ui"
import { Star, Trash2, X } from "lucide-react"
import { useEffect, useState } from "react"

import {
	type ClubContactData,
	addClubContactRoleAction,
	removeClubContactAction,
	removeClubContactRoleAction,
	toggleClubContactPrimaryAction,
} from "../actions"
import { ContactSearchDialog } from "./contact-search-dialog"

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
	contacts: ClubContactData[]
	onRefresh: () => Promise<void>
}

export function ClubContactsSection({ clubId, contacts, onRefresh }: ClubContactsSectionProps) {
	const [mounted, setMounted] = useState(false)
	const [removing, setRemoving] = useState<number | null>(null)

	useEffect(() => setMounted(true), [])

	const handleRemoveContact = async (clubContactId: number) => {
		setRemoving(clubContactId)
		try {
			const result = await removeClubContactAction(clubContactId)
			if (result.success) {
				toast.success("Contact removed")
				await onRefresh()
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
			const result = await addClubContactRoleAction(clubContactId, role)
			if (result.success) {
				await onRefresh()
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
			const result = await removeClubContactRoleAction(roleId)
			if (result.success) {
				await onRefresh()
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
			const result = await toggleClubContactPrimaryAction(clubContactId)
			if (result.success) {
				toast.success("Primary contact updated")
				await onRefresh()
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
					onContactAdded={onRefresh}
				/>
			</CardHeader>
			<CardContent className="overflow-x-auto px-0 pb-0">
				{contacts.length === 0 ? (
					<p className="px-6 text-sm text-gray-500">No contacts added to this club yet.</p>
				) : (
					<Table className="min-w-full divide-y divide-gray-200">
						<TableHeader className="bg-secondary-50">
							<TableRow className="hover:bg-secondary-50">
								<TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-900">
									Name
								</TableHead>
								<TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-900">
									Email
								</TableHead>
								<TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-900">
									Phone
								</TableHead>
								<TableHead className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-secondary-900">
									Roles
								</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody className="divide-y divide-gray-100 bg-white">
							{contacts.map((cc) => {
								const assignedRoles = cc.roles.map((r) => r.role)
								const availableRoles = PREDEFINED_ROLES.filter((r) => !assignedRoles.includes(r))

								return (
									<TableRow key={cc.clubContactId} className="hover:bg-gray-50">
										<TableCell className="px-4 py-3 text-sm font-medium">
											<div className="flex items-center gap-1">
												<button
													type="button"
													onClick={() => handleTogglePrimary(cc.clubContactId)}
													className="shrink-0 rounded p-0.5 hover:bg-gray-100"
													title={cc.isPrimary ? "Remove primary" : "Set as primary"}
												>
													<Star
														className={`h-4 w-4 ${cc.isPrimary ? "text-yellow-500" : "text-gray-300"}`}
														fill={cc.isPrimary ? "currentColor" : "none"}
													/>
												</button>
												{cc.firstName} {cc.lastName}
											</div>
										</TableCell>
										<TableCell className="px-4 py-3 text-sm">{cc.email || "-"}</TableCell>
										<TableCell className="px-4 py-3 text-sm">{cc.primaryPhone || "-"}</TableCell>
										<TableCell className="px-4 py-3">
											<div className="flex flex-wrap items-center gap-1">
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
														<SelectTrigger className="h-7 w-[140px] text-xs">
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
										</TableCell>
										<TableCell className="px-4 py-3">
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
										</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	)
}
