import { MapPin, Globe, Mail, Phone } from "lucide-react"
import Image from "next/image"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { H2 } from "./ui/heading"

export interface GolfCourseCardProps {
	name: string
	address: string
	city: string
	state: string
	zip: string
	websiteUrl?: string | null
	email?: string | null
	phone?: string | null
	logoUrl?: string | null
	notes?: string | null
}

export function GolfCourseCard({
	name,
	address,
	city,
	state,
	zip,
	websiteUrl,
	email,
	phone,
	logoUrl,
	notes,
}: GolfCourseCardProps) {
	const fullAddress = `${address}, ${city}, ${state} ${zip}`
	const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<H2 className="text-lg">{name}</H2>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{logoUrl && (
					<div className="mb-4 flex justify-center">
						<Image
							src={logoUrl}
							alt={`${name} logo`}
							width={120}
							height={80}
							className="h-20 w-auto object-contain"
						/>
					</div>
				)}

				<div className="space-y-3">
					<a
						href={mapsUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-start gap-3 text-gray-600 hover:text-secondary-600"
					>
						<MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
						<span className="text-sm">
							{address}
							<br />
							{city}, {state} {zip}
						</span>
					</a>

					{websiteUrl && (
						<a
							href={websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-3 text-secondary-600 hover:text-secondary-700"
						>
							<Globe className="h-5 w-5 shrink-0 text-gray-400" />
							<span className="text-sm">Website</span>
						</a>
					)}

					{email && (
						<a
							href={`mailto:${email}`}
							className="flex items-center gap-3 text-secondary-600 hover:text-secondary-700"
						>
							<Mail className="h-5 w-5 shrink-0 text-gray-400" />
							<span className="text-sm">{email}</span>
						</a>
					)}

					{phone && (
						<a
							href={`tel:${phone}`}
							className="flex items-center gap-3 text-secondary-600 hover:text-secondary-700"
						>
							<Phone className="h-5 w-5 shrink-0 text-gray-400" />
							<span className="text-sm">{phone}</span>
						</a>
					)}
				</div>

				{notes && <p className="mt-4 text-sm text-gray-500">{notes}</p>}
			</CardContent>
		</Card>
	)
}
