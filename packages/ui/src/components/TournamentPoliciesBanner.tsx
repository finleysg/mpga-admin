import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function TournamentPoliciesBanner() {
	return (
		<div className="mx-auto max-w-6xl px-4 print:hidden">
			<Link
				href="/tournaments/policies"
				className="group flex items-center justify-between rounded-lg bg-primary-50 px-6 py-4 transition-colors hover:bg-primary-100"
			>
				<div>
					<h3 className="font-heading text-lg font-semibold text-primary-700">
						Tournament Policies
					</h3>
					<p className="text-sm text-primary-600">Review tournament player policies</p>
				</div>
				<ArrowRight className="h-5 w-5 text-primary-600 transition-transform group-hover:translate-x-1" />
			</Link>
		</div>
	)
}
