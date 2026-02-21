"use client"

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Input,
	Label,
	toast,
} from "@mpga/ui"
import { useEffect, useState } from "react"

import { saveContactForContact } from "../../actions"
import type { ClubContactData } from "../../types"

interface ContactEditDialogProps {
	clubId: number
	contact: ClubContactData | null
	open: boolean
	onOpenChange: (open: boolean) => void
	onSaved: () => void
}

export function ContactEditDialog({
	clubId,
	contact,
	open,
	onOpenChange,
	onSaved,
}: ContactEditDialogProps) {
	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [email, setEmail] = useState("")
	const [primaryPhone, setPrimaryPhone] = useState("")
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (contact) {
			setFirstName(contact.firstName)
			setLastName(contact.lastName)
			setEmail(contact.email ?? "")
			setPrimaryPhone(contact.primaryPhone ?? "")
			setError(null)
		}
	}, [contact])

	const handleSave = async () => {
		if (!contact) return

		const trimmedFirst = firstName.trim()
		const trimmedLast = lastName.trim()
		if (!trimmedFirst) {
			setError("First name is required")
			return
		}
		if (!trimmedLast) {
			setError("Last name is required")
			return
		}

		setSaving(true)
		setError(null)
		try {
			const result = await saveContactForContact(clubId, {
				id: contact.contactId,
				firstName: trimmedFirst,
				lastName: trimmedLast,
				email: email.trim() || null,
				primaryPhone: primaryPhone.trim() || null,
			})
			if (result.success) {
				toast.success("Contact updated")
				onOpenChange(false)
				onSaved()
			} else {
				setError(result.error ?? "Failed to save contact")
			}
		} catch (err) {
			console.error("Failed to save contact:", err)
			setError("Failed to save contact")
		} finally {
			setSaving(false)
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="font-heading">Edit Contact</AlertDialogTitle>
					<AlertDialogDescription>Update contact details.</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="edit-firstName">First Name *</Label>
						<Input
							id="edit-firstName"
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							autoFocus
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-lastName">Last Name *</Label>
						<Input
							id="edit-lastName"
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-email">Email</Label>
						<Input
							id="edit-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="edit-phone">Primary Phone</Label>
						<Input
							id="edit-phone"
							value={primaryPhone}
							onChange={(e) => setPrimaryPhone(e.target.value)}
						/>
					</div>
				</div>

				{error && <p className="text-destructive text-sm">{error}</p>}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
					<Button onClick={handleSave} disabled={saving}>
						{saving ? "Saving..." : "Save"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
