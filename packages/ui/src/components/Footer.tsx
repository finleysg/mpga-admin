import Link from "next/link"

const navigationLinks = [
	{ label: "Tournaments", href: "/tournaments" },
	{ label: "Match Play", href: "/match-play" },
	{ label: "Members", href: "/members" },
	{ label: "News", href: "/news" },
]

const informationLinks = [
	{ label: "About Us", href: "/about-us" },
	{ label: "Contact Us", href: "/contact-us" },
]

const partnerLinks = [
	{ label: "MGA", href: "https://mngolf.org" },
	{ label: "USGA", href: "https://usga.org" },
	{ label: "PGA Minnesota", href: "https://minnesotapga.com" },
]

export function Footer() {
	return (
		<footer className="bg-primary-900 py-12 text-white">
			<div className="mx-auto max-w-7xl px-6">
				{/* Footer columns */}
				<div className="grid grid-cols-2 gap-8 md:grid-cols-3">
					{/* Navigation column */}
					<div>
						<h4 className="mb-4 font-heading text-lg">Navigation</h4>
						<nav className="flex flex-col space-y-2">
							{navigationLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-primary-200 transition-colors hover:text-white"
								>
									{link.label}
								</Link>
							))}
						</nav>
					</div>

					{/* Information column */}
					<div>
						<h4 className="mb-4 font-heading text-lg">Information</h4>
						<nav className="flex flex-col space-y-2">
							{informationLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-primary-200 transition-colors hover:text-white"
								>
									{link.label}
								</Link>
							))}
						</nav>
					</div>

					{/* Partners column */}
					<div className="col-span-2 md:col-span-1">
						<h4 className="mb-4 font-heading text-lg">Partners</h4>
						<nav className="flex flex-col space-y-2">
							{partnerLinks.map((link) => (
								<a
									key={link.href}
									href={link.href}
									target="_blank"
									rel="noopener noreferrer"
									className="text-primary-200 transition-colors hover:text-white"
								>
									{link.label}
								</a>
							))}
						</nav>
					</div>
				</div>

				{/* Copyright */}
				<div className="mt-8 border-t border-primary-700 pt-8 text-center text-sm text-primary-200">
					&copy; {new Date().getFullYear()} Zoomdoggy Design
				</div>
			</div>
		</footer>
	)
}
