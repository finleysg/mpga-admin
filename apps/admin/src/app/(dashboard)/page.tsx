import { H1, H2 } from "@mpga/ui"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
	return (
		<main className="mx-auto max-w-6xl px-4 py-8">
			<div className="mb-8 flex items-center justify-between">
				<H1 variant="secondary">Admin Dashboard</H1>
			</div>

			<div className="rounded-lg bg-white shadow">
				<div className="border-b border-gray-200 px-6 py-4">
					<H2 variant="secondary">MPGA Administration</H2>
				</div>
				<div className="px-6 py-8 text-center text-gray-500">
					Welcome to the MPGA admin dashboard.
				</div>
			</div>
		</main>
	)
}
