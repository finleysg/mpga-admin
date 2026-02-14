"use client"

import { FeatureCard, type FeatureCardProps } from "./FeatureCard"
import { H2 } from "./ui/heading"

export interface FeatureCardsSectionProps {
	cards: FeatureCardProps[]
}

const displayOrder = ["home-tournaments", "home-match-play", "home-clubs"]

export function FeatureCardsSection({ cards }: FeatureCardsSectionProps) {
	if (!cards || cards.length === 0) {
		return null
	}

	const sortedCards = [...cards].sort(
		(a, b) => displayOrder.indexOf(a.systemName) - displayOrder.indexOf(b.systemName),
	)

	return (
		<section className="py-12">
			<div className="mx-auto max-w-6xl px-4">
				<H2 className="mb-10 text-center text-3xl">What We Do</H2>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					{sortedCards.map((card) => (
						<FeatureCard key={card.systemName} {...card} />
					))}
				</div>
			</div>
		</section>
	)
}
