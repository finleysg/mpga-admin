"use client"

import Image from "next/image"
import Link from "next/link"

import { Button } from "../ui/button"

export interface HeroSlideProps {
	type: "logo" | "tournament"
	imageUrl: string
	title?: string
	subtitle?: string
	dates?: string
	venue?: string
	ctaUrl?: string
	ctaText?: string
}

export function HeroSlide({
	type,
	imageUrl,
	title,
	subtitle,
	dates,
	venue,
	ctaUrl,
	ctaText = "Learn More",
}: HeroSlideProps) {
	if (type === "logo") {
		return (
			<>
				{/* Mobile: centered logo on brand background */}
				<div className="relative flex h-[360px] w-full flex-col bg-secondary-500 md:hidden">
					<div className="relative flex-1">
						<Image src={imageUrl} alt="MPGA" fill className="object-contain p-6" priority />
					</div>
					<div className="pb-8 text-center">
						<h1 className="text-xl font-bold text-white">Minnesota Public Golf Association</h1>
						<p className="text-secondary-100">Promoting public golf since 1923</p>
					</div>
				</div>

				{/* Desktop: 66/34 layout */}
				<div className="hidden h-[500px] w-full overflow-hidden rounded-lg md:flex">
					<div className="relative w-2/3 bg-secondary-500">
						<Image src={imageUrl} alt="MPGA" fill className="object-contain p-8" priority />
					</div>
					<div className="flex w-1/3 flex-col justify-center bg-primary-700 p-6 text-white">
						<h1 className="mb-4 text-2xl font-bold leading-tight md:text-3xl">
							Minnesota Public Golf Association
						</h1>
						<p className="text-lg text-secondary-100 md:text-xl">
							Promoting public golf since 1923
						</p>
					</div>
				</div>
			</>
		)
	}

	// Tournament slides
	return (
		<>
			{/* Mobile: full-bleed with gradient overlay */}
			<div className="relative h-[350px] w-full md:hidden">
				<Image src={imageUrl} alt={title || "Tournament"} fill className="object-cover" priority />

				{/* Gradient overlay */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

				{/* Content overlay */}
				<div className="absolute bottom-0 left-0 right-0 p-5 text-white">
					<h2 className="text-xl font-bold">{title}</h2>
					<p className="text-sm opacity-90">
						{dates}
						{dates && venue && " • "}
						{venue}
					</p>
					{ctaUrl && (
						<Link href={ctaUrl}>
							<Button
								size="sm"
								variant="outline"
								className="mt-3 border-white bg-transparent text-white hover:bg-white hover:text-primary-700"
							>
								{ctaText}
							</Button>
						</Link>
					)}
				</div>
			</div>

			{/* Desktop: 66/34 layout */}
			<div className="hidden h-[500px] w-full overflow-hidden rounded-lg md:flex">
				<div className="relative w-2/3">
					<Image
						src={imageUrl}
						alt={title || "Tournament"}
						fill
						className="object-cover"
						priority
					/>
				</div>
				<div className="flex w-1/3 flex-col justify-center bg-primary-700 p-6 text-white">
					<h2 className="mb-2 text-xl font-bold leading-tight md:text-2xl">{title}</h2>
					{subtitle && <p className="mb-4 text-sm text-primary-200">{subtitle}</p>}
					{dates && <p className="mb-1 text-base font-medium text-primary-100">{dates}</p>}
					{venue && <p className="mb-6 text-sm text-primary-200">{venue}</p>}
					{ctaUrl && (
						<Link href={ctaUrl}>
							<Button
								variant="outline"
								className="border-white bg-transparent text-white hover:bg-white hover:text-primary-700"
							>
								{ctaText}
							</Button>
						</Link>
					)}
				</div>
			</div>
		</>
	)
}
