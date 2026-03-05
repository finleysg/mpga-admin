import { TournamentPoliciesBanner } from "@mpga/ui"

export default function TournamentYearLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<div className="py-4">
				<TournamentPoliciesBanner />
			</div>
			{children}
		</>
	)
}
