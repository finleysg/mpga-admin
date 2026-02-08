import { Calendar, ExternalLink } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { H2 } from "./ui/heading"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "./ui/item"

export interface TournamentLinkItem {
	id: number
	linkType: string
	url: string
	title: string
}

export interface RegistrationCardProps {
	registrationStart?: string | null
	registrationEnd?: string | null
	links: TournamentLinkItem[]
}

function formatDateTime(dateString: string): string {
	if (!dateString) return ""
	const date = new Date(dateString)
	if (isNaN(date.getTime())) return ""
	return date.toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	})
}

export function RegistrationCard({
	registrationStart,
	registrationEnd,
	links,
}: RegistrationCardProps) {
	const hasRegistrationDates = registrationStart || registrationEnd
	const hasLinks = links.length > 0

	if (!hasRegistrationDates && !hasLinks) {
		return null
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<H2 className="text-lg">Registration</H2>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{hasRegistrationDates && (
					<div className="mb-4 space-y-3">
						{registrationStart && (
							<Item size="sm">
								<ItemMedia>
									<Calendar className="h-5 w-5 text-gray-400" />
								</ItemMedia>
								<ItemContent>
									<ItemTitle className="text-gray-500">Opens</ItemTitle>
									<ItemDescription className="text-gray-900">
										{formatDateTime(registrationStart)}
									</ItemDescription>
								</ItemContent>
							</Item>
						)}
						{registrationEnd && (
							<Item size="sm">
								<ItemMedia>
									<Calendar className="h-5 w-5 text-gray-400" />
								</ItemMedia>
								<ItemContent>
									<ItemTitle className="text-gray-500">Closes</ItemTitle>
									<ItemDescription className="text-gray-900">
										{formatDateTime(registrationEnd)}
									</ItemDescription>
								</ItemContent>
							</Item>
						)}
					</div>
				)}

				{hasLinks && (
					<div className="space-y-2">
						{links.map((link) => (
							<Item asChild size="sm" key={link.id}>
								<a
									href={link.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-secondary-600 hover:text-secondary-700"
								>
									<ItemMedia>
										<ExternalLink className="h-4 w-4" />
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{link.title}</ItemTitle>
									</ItemContent>
								</a>
							</Item>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
