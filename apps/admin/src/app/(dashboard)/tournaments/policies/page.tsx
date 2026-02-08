import { Button, Card, CardContent, ContentCard, H1 } from "@mpga/ui"
import { Pencil, Plus } from "lucide-react"
import Link from "next/link"

import { getContentAction } from "./actions"

export default async function PoliciesPage() {
	const result = await getContentAction("TP")
	if (!result.success) {
		throw new Error(result.error ?? "Failed to load content")
	}
	const content = result.data

	return (
		<div className="mx-auto max-w-6xl">
			<div className="mb-6 flex items-center justify-between">
				<H1 variant="secondary">Manage Tournament Policies</H1>
				<Button variant="secondary" asChild>
					<Link href="/tournaments/policies/edit">
						{content ? (
							<>
								<Pencil className="mr-2 h-4 w-4" />
								Edit
							</>
						) : (
							<>
								<Plus className="mr-2 h-4 w-4" />
								Create
							</>
						)}
					</Link>
				</Button>
			</div>
			{content ? (
				<ContentCard
					heading="h2"
					title={content.title}
					content={content.contentText}
					variant="primary"
				/>
			) : (
				<Card>
					<CardContent>
						<p className="text-gray-500">No tournament policies have been created yet.</p>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
