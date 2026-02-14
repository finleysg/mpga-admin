import { AboutNav } from "@mpga/ui"

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<AboutNav />
			{children}
		</>
	)
}
