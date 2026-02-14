import { Download } from "lucide-react"

import { Button } from "./ui/button"

export interface DownloadLinkProps {
	href: string
	title: string
}

export function DownloadLink({ href, title }: DownloadLinkProps) {
	return (
		<Button asChild>
			<a href={href} target="_blank" rel="noopener noreferrer">
				<Download className="h-4 w-4" />
				{title}
			</a>
		</Button>
	)
}
