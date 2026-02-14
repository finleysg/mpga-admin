"use client"

import { useState } from "react"

export interface CollapsibleListProps {
	children: React.ReactNode[]
	maxItems?: number
}

export function CollapsibleList({ children, maxItems = 8 }: CollapsibleListProps) {
	const [isExpanded, setIsExpanded] = useState(false)

	const hiddenCount = children.length - maxItems
	const hasHiddenItems = hiddenCount > 0
	const visibleChildren = isExpanded ? children : children.slice(0, maxItems)

	return (
		<>
			{visibleChildren}
			{hasHiddenItems && !isExpanded && (
				<button
					type="button"
					onClick={() => setIsExpanded(true)}
					className="mt-2 text-sm font-medium text-secondary-600 hover:text-secondary-700"
				>
					{hiddenCount} more...
				</button>
			)}
		</>
	)
}
