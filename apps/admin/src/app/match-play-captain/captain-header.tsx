export function CaptainHeader() {
	const publicSiteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:4000"

	return (
		<header className="-mx-4 -mt-4 flex items-center justify-between bg-secondary-500 px-4 py-3 md:-mx-6 md:-mt-6 md:px-6">
			<span className="font-heading text-xl text-white">MPGA</span>
			<a href={`${publicSiteUrl}/match-play`} className="text-sm text-white/70 hover:text-white">
				mpga.net &rarr;
			</a>
		</header>
	)
}
