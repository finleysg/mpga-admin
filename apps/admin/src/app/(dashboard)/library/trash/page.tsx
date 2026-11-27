import {
	EmptyState,
	H1,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mpga/ui"
import { ArrowLeft, Folder } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { FileIcon } from "@/components/library/file-icon"
import { LocalDate } from "@/components/library/local-date"
import { TrashRestore } from "@/components/library/trash-restore"
import { db } from "@/lib/db"
import { listTrash } from "@/lib/library/admin"
import { getFolderView } from "@/lib/library/service"
import { requireLibraryUser } from "@/lib/require-auth"

function contents(folderCount: number, fileCount: number) {
	const parts = []
	if (folderCount > 1) parts.push(`${folderCount - 1} subfolder${folderCount > 2 ? "s" : ""}`)
	if (fileCount) parts.push(`${fileCount} file${fileCount > 1 ? "s" : ""}`)
	return parts.length ? `With ${parts.join(" and ")}` : "Empty"
}

export default async function LibraryTrashPage() {
	const viewer = await requireLibraryUser()
	if (!viewer) redirect("/login")
	if (!viewer.isDocumentAdmin) redirect("/library")

	const [trash, view] = await Promise.all([listTrash(db, viewer), getFolderView(db, viewer, null)])
	const items = trash.ok ? trash.data : []
	const folders = view.ok ? view.data.tree : []

	return (
		<div className="mx-auto max-w-6xl space-y-4">
			<Link
				href="/library"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
			>
				<ArrowLeft className="h-4 w-4" aria-hidden /> Library
			</Link>
			<div>
				<H1 variant="secondary">Trash</H1>
				<p className="text-sm text-muted-foreground">
					Deleted folders and files stay here until restored. Nothing is removed automatically.
				</p>
			</div>

			{items.length === 0 ? (
				<EmptyState message="Trash is empty." />
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead className="hidden md:table-cell">Was in</TableHead>
							<TableHead>Deleted</TableHead>
							<TableHead className="w-28" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((item) => (
							<TableRow key={`${item.kind}-${item.id}`}>
								<TableCell>
									<div className="flex items-center gap-2">
										{item.kind === "folder" ? (
											<Folder className="h-5 w-5 shrink-0 text-secondary-500" aria-hidden />
										) : (
											<FileIcon name={item.name} />
										)}
										<div className="min-w-0">
											<span className="block truncate font-medium">{item.name}</span>
											{item.kind === "folder" && (
												<span className="block text-xs text-muted-foreground">
													{contents(item.folderCount, item.fileCount)}
												</span>
											)}
										</div>
									</div>
								</TableCell>
								<TableCell className="hidden md:table-cell">
									{item.location || "Top level"}
									{!item.parentIsLive && (
										<span className="block text-xs text-muted-foreground">
											That folder is also in Trash
										</span>
									)}
								</TableCell>
								<TableCell className="text-sm">
									<span className="block">{item.deletedByName ?? "Former member"}</span>
									<span className="block text-xs text-muted-foreground">
										<LocalDate value={item.deletedAt} withTime />
									</span>
								</TableCell>
								<TableCell className="text-right">
									<TrashRestore
										kind={item.kind}
										id={item.id}
										name={item.name}
										parentIsLive={item.parentIsLive}
										folders={folders}
									/>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	)
}
