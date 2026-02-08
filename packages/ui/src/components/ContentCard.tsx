import { Markdown } from "./Markdown"
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "./ui/card"
import { H1, H2, H3, H4 } from "./ui/heading"

export interface ContentCardProps {
	heading: "h1" | "h2" | "h3" | "h4"
	title: string
	content: string
	variant?: "primary" | "secondary"
	className?: string
	action?: React.ReactNode
}

const headingComponents = {
	h1: H1,
	h2: H2,
	h3: H3,
	h4: H4,
} as const

export function ContentCard({
	heading,
	title,
	content,
	variant,
	className,
	action,
}: ContentCardProps) {
	const Heading = headingComponents[heading]

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>
					<Heading variant={variant}>{title}</Heading>
				</CardTitle>
				{action && <CardAction>{action}</CardAction>}
			</CardHeader>
			<CardContent>
				<Markdown content={content} />
			</CardContent>
		</Card>
	)
}
