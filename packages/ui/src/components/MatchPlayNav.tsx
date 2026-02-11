"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
	{ label: "Overview", href: "/match-play" },
	{ label: "Teams", href: "/match-play/teams" },
	{ label: "Results", href: "/match-play/results" },
	{ label: "Rules", href: "/match-play/rules" },
]

export function MatchPlayNav() {
	const pathname = usePathname()

	return (
		<nav className="overflow-x-auto border-b border-gray-200 print:hidden">
			<div className="mx-auto flex max-w-6xl px-4">
				{navItems.map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors ${
							pathname === item.href
								? "border-b-2 border-primary-600 text-primary-600"
								: "text-gray-500 hover:text-gray-700"
						}`}
					>
						{item.label}
					</Link>
				))}
			</div>
		</nav>
	)
}
