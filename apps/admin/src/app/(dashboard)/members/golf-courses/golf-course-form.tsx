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

import { type GolfCourseData, deleteGolfCourseAction, saveGolfCourseAction } from "./actions"

interface GolfCourseFormProps {
	golfCourse?: GolfCourseData
}

export function GolfCourseForm({ golfCourse }: GolfCourseFormProps) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [name, setName] = useState(golfCourse?.name ?? "")
	const [websiteUrl, setWebsiteUrl] = useState(golfCourse?.websiteUrl ?? "")
	const [email, setEmail] = useState(golfCourse?.email ?? "")
	const [phone, setPhone] = useState(golfCourse?.phone ?? "")
	const [addressText, setAddressText] = useState(golfCourse?.addressText ?? "")
	const [city, setCity] = useState(golfCourse?.city ?? "")
	const [state, setState] = useState(golfCourse?.state ?? "")
	const [zip, setZip] = useState(golfCourse?.zip ?? "")
	const [logo, setLogo] = useState(golfCourse?.logo ?? "")
	const [notes, setNotes] = useState(golfCourse?.notes ?? "")

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!name.trim()) {
			setError("Name is required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const result = await saveGolfCourseAction({
				id: golfCourse?.id,
				name: name.trim(),
				websiteUrl: websiteUrl.trim(),
				email: email.trim(),
				phone: phone.trim(),
				addressText: addressText.trim(),
				city: city.trim(),
				state: state.trim(),
				zip: zip.trim(),
				logo: logo.trim(),
				notes: notes.trim() || null,
			})

			if (result.success) {
				toast.success(golfCourse ? "Golf course updated" : "Golf course created")
				router.push("/members/golf-courses")
			} else {
				setError(result.error ?? "Failed to save golf course")
			}
		} catch (err) {
			console.error("Failed to save golf course:", err)
			setError("Failed to save golf course")
		} finally {
			setSaving(false)
		}
	}

	const handleCancel = () => {
		router.push("/members/golf-courses")
	}

	const handleDelete = async () => {
		if (!golfCourse?.id) return

		setDeleting(true)
		setError(null)

		try {
			const result = await deleteGolfCourseAction(golfCourse.id)

			if (result.success) {
				toast.success("Golf course deleted")
				router.push("/members/golf-courses")
			} else {
				setDeleteDialogOpen(false)
				setError(result.error ?? "Failed to delete golf course")
			}
		} catch (err) {
			console.error("Failed to delete golf course:", err)
			setDeleteDialogOpen(false)
			setError("Failed to delete golf course")
		} finally {
			setDeleting(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading">Golf Course Information</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSave} className="space-y-4">
					{/* Row 1: Name */}
					<Field>
						<FieldLabel htmlFor="name">
							Name <span className="text-destructive">*</span>
						</FieldLabel>
						<Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
					</Field>

					{/* Row 2: Website URL */}
					<Field>
						<FieldLabel htmlFor="websiteUrl">Website URL</FieldLabel>
						<Input
							id="websiteUrl"
							value={websiteUrl}
							onChange={(e) => setWebsiteUrl(e.target.value)}
						/>
					</Field>

					{/* Row 3: Email and Phone */}
					<div className="grid grid-cols-2 gap-4">
						<Field>
							<FieldLabel htmlFor="email">Email</FieldLabel>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="phone">Phone</FieldLabel>
							<Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
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

					{/* Row 6: Logo */}
					<Field>
						<FieldLabel htmlFor="logo">Logo</FieldLabel>
						<Input id="logo" value={logo} onChange={(e) => setLogo(e.target.value)} />
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
						{golfCourse && (
							<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
								<AlertDialogTrigger asChild>
									<Button type="button" variant="destructive">
										<Trash2 className="mr-2 h-4 w-4" />
										Delete
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Delete Golf Course</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to delete {golfCourse.name}? This action cannot be
											undone.
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
						{!golfCourse && <div />}

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
				</form>
			</CardContent>
		</Card>
	)
}
