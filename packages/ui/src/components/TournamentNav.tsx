"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
	{ label: "Policies", href: "/tournaments/policies" },
	{ label: "Terms of Competition", href: "/tournaments/hard-card" },
]

export function TournamentNav() {
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
