import { TournamentNav } from "@mpga/ui"

export default function TournamentYearLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<TournamentNav />
			{children}
		</>
	)
}
