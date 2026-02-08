"use client"

import { Trophy, Users, MapPin, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { H3 } from "./ui/heading"

export interface FeatureCardProps {
	contentType: string
	title: string
	description: string
}

const iconMap: Record<string, { icon: LucideIcon; route: string }> = {
	T1: { icon: Trophy, route: "/tournaments" },
	M1: { icon: Users, route: "/match-play" },
	C1: { icon: MapPin, route: "/members" },
}

export function FeatureCard({ contentType, title, description }: FeatureCardProps) {
	const { icon: Icon, route } = iconMap[contentType] || {
		icon: Trophy,
		route: "/",
	}

	return (
		<Card className="items-center text-center transition-shadow hover:shadow-md">
			<CardContent>
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
					<Icon className="h-8 w-8 text-primary-600" />
				</div>
				<H3 className="mb-3">{title}</H3>
				<p className="mb-6 flex-1 text-gray-600">{description}</p>
				<Link href={route}>
					<Button variant="outline">Learn More</Button>
				</Link>
			</CardContent>
		</Card>
	)
}
