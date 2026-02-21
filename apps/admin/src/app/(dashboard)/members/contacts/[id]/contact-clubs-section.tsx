"use client"

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@mpga/ui"
import { Star } from "lucide-react"
import Link from "next/link"

import type { ContactClubData } from "../actions"

interface ContactClubsSectionProps {
	clubs: ContactClubData[]
}

export function ContactClubsSection({ clubs }: ContactClubsSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="font-heading text-xl">Club Associations</CardTitle>
			</CardHeader>
			<CardContent>
				{clubs.length === 0 ? (
					<p className="text-sm text-gray-500">Not associated with any clubs.</p>
				) : (
					<div className="divide-y divide-gray-100">
						{clubs.map((c) => (
							<div key={c.clubId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
								{c.isPrimary && (
									<Star className="h-4 w-4 shrink-0 text-yellow-500" fill="currentColor" />
								)}
								<Link
									href={`/members/clubs/${c.clubId}`}
									className="font-medium text-secondary-600 hover:underline"
								>
									{c.clubName}
								</Link>
								{c.roles.map((role) => (
									<Badge
										key={role}
										variant="outline"
										className="border-secondary-200 bg-secondary-100"
									>
										{role}
									</Badge>
								))}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
