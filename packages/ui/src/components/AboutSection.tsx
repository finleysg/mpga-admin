import { H2 } from "./ui/heading"

export interface AboutSectionProps {
	title: string
	content: string
}

export function AboutSection({ title, content }: AboutSectionProps) {
	const paragraphs = content.split(/\n\n+/).filter((p) => p.trim())

	return (
		<section className="bg-primary-50 py-16">
			<div className="mx-auto max-w-3xl px-4 text-center">
				<H2 className="mb-8 text-3xl">{title}</H2>
				<div className="space-y-4">
					{paragraphs.map((paragraph, index) => (
						<p key={index} className="text-lg leading-relaxed text-gray-700">
							{paragraph}
						</p>
					))}
				</div>
			</div>
		</section>
	)
}
