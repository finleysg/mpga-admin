import { MatchPlayNav } from "@mpga/ui"

export default function MatchPlayLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<MatchPlayNav />
			{children}
		</>
	)
}
