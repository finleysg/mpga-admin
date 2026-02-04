"use client";

import { FeatureCard, type FeatureCardProps } from "./FeatureCard";

export interface FeatureCardsSectionProps {
  cards: FeatureCardProps[];
}

const displayOrder = ["T1", "M1", "C1"];

export function FeatureCardsSection({ cards }: FeatureCardsSectionProps) {
  if (!cards || cards.length === 0) {
    return null;
  }

  const sortedCards = [...cards].sort(
    (a, b) =>
      displayOrder.indexOf(a.contentType) - displayOrder.indexOf(b.contentType),
  );

  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-heading mb-10 text-center text-3xl font-bold text-primary-900">
          What We Do
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sortedCards.map((card) => (
            <FeatureCard key={card.contentType} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}
