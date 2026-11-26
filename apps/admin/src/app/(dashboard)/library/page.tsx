import { EmptyState, H1 } from "@mpga/ui"
import { redirect } from "next/navigation"

import { requireLibraryUser } from "@/lib/require-auth"

// Placeholder until the library browser lands (plan step 4).
export default async function LibraryPage() {
	const libraryUser = await requireLibraryUser()
	if (!libraryUser) redirect("/login")

	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<H1 variant="secondary">Library</H1>
			<EmptyState message="No documents yet." />
		</main>
	)
}
