"use client"

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Field,
	FieldError,
	FieldLabel,
	Input,
	toast,
} from "@mpga/ui"
import { useState } from "react"

import { type MembershipData, saveClubPaymentAction } from "../actions"

interface ClubPaymentSectionProps {
	clubId: number
	year: number
	membership: MembershipData | null
	onRefresh: () => Promise<void>
}

export function ClubPaymentSection({
	clubId,
	year,
	membership,
	onRefresh,
}: ClubPaymentSectionProps) {
	const today = new Date().toISOString().split("T")[0]
	const [paymentDate, setPaymentDate] = useState(today)
	const [paymentCode, setPaymentCode] = useState("")
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSave = async () => {
		if (!paymentDate || !paymentCode.trim()) {
			setError("Payment date and check number are required")
			return
		}

		setSaving(true)
		setError(null)

		try {
			const result = await saveClubPaymentAction({
				clubId,
				paymentDate,
				paymentCode: paymentCode.trim(),
			})

			if (result.success) {
				toast.success("Payment recorded")
				await onRefresh()
			} else {
				setError(result.error ?? "Failed to record payment")
			}
		} catch (err) {
			console.error("Failed to save payment:", err)
			setError("Failed to record payment")
		} finally {
			setSaving(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading text-xl">{year} Season Payment</CardTitle>
			</CardHeader>
			<CardContent>
				{membership ? (
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Badge variant="default" className="bg-green-600">
								Paid
							</Badge>
						</div>
						<p className="text-sm text-gray-700">
							<span className="font-medium">Payment Date:</span> {membership.paymentDate}
						</p>
						<p className="text-sm text-gray-700">
							<span className="font-medium">Check / Payment Code:</span> {membership.paymentCode}
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
								Unpaid
							</Badge>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<Field>
								<FieldLabel htmlFor="paymentDate">Payment Date</FieldLabel>
								<Input
									id="paymentDate"
									type="date"
									value={paymentDate}
									onChange={(e) => setPaymentDate(e.target.value)}
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="paymentCode">Check Number</FieldLabel>
								<Input
									id="paymentCode"
									value={paymentCode}
									onChange={(e) => setPaymentCode(e.target.value)}
								/>
							</Field>
						</div>
						{error && <FieldError>{error}</FieldError>}
						<Button type="button" variant="secondary" disabled={saving} onClick={handleSave}>
							{saving ? "Recording..." : "Record Payment"}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
