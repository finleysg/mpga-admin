"use client"

import { CollapsibleList } from "./CollapsibleList"

export interface AwardWinnersListProps {
	winners: { year: number; winner: string; notes: string | null }[]
}

export function AwardWinnersList({ winners }: AwardWinnersListProps) {
	if (winners.length === 0) {
		return <p className="text-sm text-gray-500">No winners listed.</p>
	}

	return (
		<ul className="space-y-3">
			<CollapsibleList maxItems={10}>
				{winners.map((w, i) => (
					<li key={i} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
						<p className="font-semibold text-primary-700">{w.year}</p>
						<p className="text-sm text-gray-600">
							{w.winner}
							{w.notes && <span className="text-gray-400"> — {w.notes}</span>}
						</p>
					</li>
				))}
			</CollapsibleList>
		</ul>
	)
}
