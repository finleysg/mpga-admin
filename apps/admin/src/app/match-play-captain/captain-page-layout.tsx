import { CaptainHeader } from "./captain-header"

export function CaptainPageLayout({
	maxWidth = "md",
	children,
}: {
	maxWidth?: "md" | "lg"
	children: React.ReactNode
}) {
	const maxWidthClass = maxWidth === "lg" ? "max-w-lg" : "max-w-md"

	return (
		<div className="bg-muted min-h-svh p-4 md:p-6">
			<div className={`mx-auto ${maxWidthClass} space-y-6`}>
				<CaptainHeader />
				{children}
			</div>
		</div>
	)
}
