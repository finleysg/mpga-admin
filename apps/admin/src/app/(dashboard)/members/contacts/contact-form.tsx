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
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Field,
	FieldError,
	FieldLabel,
	Input,
	Textarea,
	toast,
} from "@mpga/ui"
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { type ContactData, deleteContactAction, saveContactAction } from "./actions"

interface ContactFormProps {
	contact?: ContactData
	onRefresh?: () => void
}

export function ContactForm({ contact, onRefresh }: ContactFormProps) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [firstName, setFirstName] = useState(contact?.firstName ?? "")
	const [lastName, setLastName] = useState(contact?.lastName ?? "")
	const [email, setEmail] = useState(contact?.email ?? "")
	const [primaryPhone, setPrimaryPhone] = useState(contact?.primaryPhone ?? "")
	const [alternatePhone, setAlternatePhone] = useState(contact?.alternatePhone ?? "")
	const [addressText, setAddressText] = useState(contact?.addressText ?? "")
	const [city, setCity] = useState(contact?.city ?? "")
	const [state, setState] = useState(contact?.state ?? "")
	const [zip, setZip] = useState(contact?.zip ?? "")
	const [sendEmail, setSendEmail] = useState(contact?.sendEmail ?? true)
	const [notes, setNotes] = useState(contact?.notes ?? "")

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!firstName.trim() || !lastName.trim()) {
			setError("First name and last name are required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const result = await saveContactAction({
				id: contact?.id,
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				email: email.trim() || null,
				primaryPhone: primaryPhone.trim() || null,
				alternatePhone: alternatePhone.trim() || null,
				addressText: addressText.trim() || null,
				city: city.trim() || null,
				state: state.trim() || null,
				zip: zip.trim() || null,
				sendEmail,
				notes: notes.trim() || null,
			})

			if (result.success) {
				if (contact) {
					toast.success("Contact updated")
					onRefresh?.()
				} else {
					toast.success("Contact created")
					router.push(`/members/contacts/${result.data!.id}`)
				}
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

	const handleCancel = () => {
		router.push("/members/contacts")
	}

	const handleDelete = async () => {
		if (!contact?.id) return

		setDeleting(true)
		setError(null)

		try {
			const result = await deleteContactAction(contact.id)

			if (result.success) {
				toast.success("Contact deleted")
				router.push("/members/contacts")
			} else {
				setDeleteDialogOpen(false)
				setError(result.error ?? "Failed to delete contact")
			}
		} catch (err) {
			console.error("Failed to delete contact:", err)
			setDeleteDialogOpen(false)
			setError("Failed to delete contact")
		} finally {
			setDeleting(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading">Contact Information</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSave} className="space-y-4">
					{/* Row 1: First Name and Last Name */}
					<div className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="firstName">
								First Name <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="firstName"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								required
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="lastName">
								Last Name <span className="text-destructive">*</span>
							</FieldLabel>
							<Input
								id="lastName"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								required
							/>
						</Field>
					</div>

					{/* Row 2: Email */}
					<Field>
						<FieldLabel htmlFor="email">Email</FieldLabel>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</Field>

					{/* Row 3: Primary Phone and Alternate Phone */}
					<div className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="primaryPhone">Primary Phone</FieldLabel>
							<Input
								id="primaryPhone"
								value={primaryPhone}
								onChange={(e) => setPrimaryPhone(e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="alternatePhone">Alternate Phone</FieldLabel>
							<Input
								id="alternatePhone"
								value={alternatePhone}
								onChange={(e) => setAlternatePhone(e.target.value)}
							/>
						</Field>
					</div>

					{/* Row 4: Address */}
					<Field>
						<FieldLabel htmlFor="addressText">Address</FieldLabel>
						<Input
							id="addressText"
							value={addressText}
							onChange={(e) => setAddressText(e.target.value)}
						/>
					</Field>

					{/* Row 5: City, State, Zip */}
					<div className="grid grid-cols-4 gap-4">
						<Field className="col-span-2">
							<FieldLabel htmlFor="city">City</FieldLabel>
							<Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
						</Field>
						<Field>
							<FieldLabel htmlFor="state">State</FieldLabel>
							<Input
								id="state"
								value={state}
								onChange={(e) => setState(e.target.value)}
								maxLength={2}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="zip">Zip</FieldLabel>
							<Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} />
						</Field>
					</div>

					{/* Row 6: Send Email checkbox */}
					<Field orientation="horizontal">
						<Checkbox
							id="sendEmail"
							checked={sendEmail}
							onCheckedChange={(checked) => setSendEmail(checked === true)}
						/>
						<FieldLabel htmlFor="sendEmail">Send Email</FieldLabel>
					</Field>

					{/* Row 7: Notes */}
					<Field>
						<FieldLabel htmlFor="notes">Notes</FieldLabel>
						<Textarea
							id="notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={4}
						/>
					</Field>

					{/* Error message */}
					{error && <FieldError>{error}</FieldError>}

					{/* Action buttons */}
					<div className="flex justify-between pt-4">
						{/* Delete button - only shown when editing */}
						{contact?.id && (
							<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
								<AlertDialogTrigger asChild>
									<Button type="button" variant="destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Contact</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete {contact.firstName} {contact.lastName}? This
											action cannot be undone.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
										<AlertDialogAction
											onClick={(e) => {
												e.preventDefault()
												handleDelete()
											}}
											disabled={deleting}
											className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
										>
											{deleting ? "Deleting..." : "Delete"}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						)}

						{/* Spacer when no delete button */}
						{!contact?.id && <div />}

						{/* Save/Cancel buttons on the right */}
						<div className="flex gap-2">
							<Button type="button" variant="secondaryoutline" onClick={handleCancel}>
								Cancel
							</Button>
							<Button type="submit" variant="secondary" disabled={saving}>
								{saving ? "Saving..." : "Save"}
							</Button>
						</div>
					</div>
					{contact?.updateDate && (
						<p className="pt-2 text-right text-xs text-gray-400">
							Last updated{" "}
							{new Date(contact.updateDate.replace(" ", "T") + "Z").toLocaleString("en-US", {
								year: "numeric",
								month: "short",
								day: "numeric",
								hour: "numeric",
								minute: "2-digit",
							})}
							{contact.updateBy && ` by ${contact.updateBy}`}
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	)
}
