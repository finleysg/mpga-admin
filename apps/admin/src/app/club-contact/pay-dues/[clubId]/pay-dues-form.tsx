"use client"

import { Button } from "@mpga/ui"
import { PaymentElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Loader2 } from "lucide-react"
import posthog from "posthog-js"
import { useState } from "react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!)

function CheckoutForm({ clubId }: { clubId: number }) {
	const stripe = useStripe()
	const elements = useElements()
	const [error, setError] = useState<string | null>(null)
	const [processing, setProcessing] = useState(false)

	async function handleSubmit(e: React.SubmitEvent) {
		e.preventDefault()

		if (!stripe || !elements) return

		setProcessing(true)
		setError(null)

		try {
			const { error: submitError } = await elements.submit()
			if (submitError) {
				setError(submitError.message ?? "Validation failed")
				setProcessing(false)
				return
			}

			const { error: confirmError } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: `${window.location.origin}/club-contact/pay-dues/${clubId}/success`,
				},
			})

			if (confirmError) {
				setError(confirmError.message ?? "Payment failed")
				setProcessing(false)
			}
		} catch (err) {
			posthog.captureException(err instanceof Error ? err : new Error(String(err)), {
				tags: { context: "stripe-payment" },
			})
			setError(
				"Something went wrong processing your payment. Please refresh the page and try again.",
			)
			setProcessing(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<PaymentElement />
			{error && <p className="text-sm text-red-600">{error}</p>}
			<Button type="submit" disabled={!stripe || processing} className="w-full">
				{processing ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Processing...
					</>
				) : (
					"Pay $100.00"
				)}
			</Button>
		</form>
	)
}

export function PayDuesForm({ clientSecret, clubId }: { clientSecret: string; clubId: number }) {
	return (
		<Elements stripe={stripePromise} options={{ clientSecret }}>
			<CheckoutForm clubId={clubId} />
		</Elements>
	)
}
