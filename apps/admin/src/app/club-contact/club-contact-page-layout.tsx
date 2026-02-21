import { ClubContactHeader } from "./club-contact-header"

export function ClubContactPageLayout({
	systemName,
	maxWidth = "md",
	children,
}: {
	systemName?: string | null
	maxWidth?: "md" | "lg"
	children: React.ReactNode
}) {
	const maxWidthClass = maxWidth === "lg" ? "max-w-lg" : "max-w-md"

	return (
		<div className="bg-muted min-h-svh p-4 md:p-6">
			<div className={`mx-auto ${maxWidthClass} space-y-6`}>
				<ClubContactHeader systemName={systemName} />
				{children}
			</div>
		</div>
	)
}
