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
import { useCallback, useEffect, useRef, useState } from "react"

import {
	type InlineContactResult,
	createContactInlineAction,
} from "@/app/(dashboard)/members/contacts/actions"
import { searchContactsAction } from "@/app/(dashboard)/members/clubs/actions"

interface CreateContactDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	onContactCreated: (contact: InlineContactResult) => void
}

export function CreateContactDialog({
	open,
	onOpenChange,
	onContactCreated,
}: CreateContactDialogProps) {
	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [email, setEmail] = useState("")
	const [primaryPhone, setPrimaryPhone] = useState("")
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [matches, setMatches] = useState<InlineContactResult[]>([])
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		if (!open) {
			setFirstName("")
			setLastName("")
			setEmail("")
			setPrimaryPhone("")
			setError(null)
			setMatches([])
		}
	}, [open])

	const checkForDuplicates = useCallback(async (first: string, last: string) => {
		const term = `${first} ${last}`.trim()
		if (!term) {
			setMatches([])
			return
		}

		try {
			const result = await searchContactsAction(last || first)
			if (result.success && result.data) {
				setMatches(result.data)
			}
		} catch {
			// Silently ignore search errors
		}
	}, [])

	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current)
		if (firstName.trim() || lastName.trim()) {
			timerRef.current = setTimeout(
				() => checkForDuplicates(firstName.trim(), lastName.trim()),
				300,
			)
		} else {
			setMatches([])
		}
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current)
		}
	}, [firstName, lastName, checkForDuplicates])

	const handleSelectExisting = (match: InlineContactResult) => {
		onContactCreated(match)
		onOpenChange(false)
		toast.success("Existing contact selected")
	}

	const handleCreate = async () => {
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
			const result = await createContactInlineAction({
				firstName: trimmedFirst,
				lastName: trimmedLast,
				email: email.trim() || null,
				primaryPhone: primaryPhone.trim() || null,
			})
			if (result.success && result.data) {
				toast.success("Contact created")
				onContactCreated(result.data)
				onOpenChange(false)
			} else {
				setError(result.error ?? "Failed to create contact")
			}
		} catch {
			setError("Failed to create contact")
		} finally {
			setSaving(false)
		}
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-md">
				<AlertDialogHeader>
					<AlertDialogTitle className="font-heading">New Contact</AlertDialogTitle>
					<AlertDialogDescription>
						Create a new contact. Fill in the name to check for existing matches.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="create-firstName">First Name *</Label>
							<Input
								id="create-firstName"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								autoFocus
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="create-lastName">Last Name *</Label>
							<Input
								id="create-lastName"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
							/>
						</div>
					</div>

					{matches.length > 0 && (
						<div className="rounded-md border border-amber-200 bg-amber-50 p-3">
							<p className="mb-2 text-sm font-medium text-amber-800">Possible matches found:</p>
							<div className="max-h-32 space-y-1 overflow-y-auto">
								{matches.map((m) => (
									<button
										key={m.id}
										type="button"
										onClick={() => handleSelectExisting(m)}
										className="w-full rounded px-2 py-1 text-left text-sm hover:bg-amber-100"
									>
										<span className="font-medium">
											{m.firstName} {m.lastName}
										</span>
										{m.email && <span className="ml-2 text-amber-700">{m.email}</span>}
									</button>
								))}
							</div>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="create-email">Email</Label>
						<Input
							id="create-email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="create-phone">Primary Phone</Label>
						<Input
							id="create-phone"
							value={primaryPhone}
							onChange={(e) => setPrimaryPhone(e.target.value)}
						/>
					</div>
				</div>

				{error && <p className="text-sm text-destructive">{error}</p>}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
					<Button variant="secondary" onClick={handleCreate} disabled={saving}>
						{saving ? "Creating..." : "Create"}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
