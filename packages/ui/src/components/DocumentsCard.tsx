import { FileText, Download } from "lucide-react"

import { CollapsibleList } from "./CollapsibleList"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { H2 } from "./ui/heading"
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "./ui/item"

export interface DocumentItem {
	id: number
	title: string
	fileUrl: string
}

export interface DocumentsCardProps {
	documents: DocumentItem[]
	title?: string
	maxItems?: number
}

export function DocumentsCard({ documents, title = "Documents", maxItems }: DocumentsCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					<H2 className="text-lg">{title}</H2>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{documents.length === 0 ? (
					<p className="text-sm text-gray-500">No documents available.</p>
				) : (
					<div className="space-y-3">
						<CollapsibleList maxItems={maxItems}>
							{documents.map((doc) => (
								<Item asChild size="sm" key={doc.id} className="hover:bg-gray-50">
									<a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
										<ItemMedia>
											<FileText className="h-5 w-5 text-gray-400" />
										</ItemMedia>
										<ItemContent>
											<ItemTitle className="text-gray-700">{doc.title}</ItemTitle>
										</ItemContent>
										<ItemActions>
											<Download className="h-4 w-4 text-secondary-600" />
										</ItemActions>
									</a>
								</Item>
							))}
						</CollapsibleList>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
