import { Button, Card, CardContent, H1 } from "@mpga/ui"
import { Lock, Trash2 } from "lucide-react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { FolderMenu } from "@/components/library/admin-menus"
import { FolderContents } from "@/components/library/folder-contents"
import { FolderTree } from "@/components/library/folder-tree"
import { LibraryBreadcrumb } from "@/components/library/library-breadcrumb"
import { LibrarySearchBox } from "@/components/library/library-search-box"
import { NewFolderDialog } from "@/components/library/new-folder-dialog"
import { UploadDialog } from "@/components/library/upload-dialog"
import { db } from "@/lib/db"
import { MAX_FOLDER_DEPTH } from "@/lib/library/names"
import { getFolderView } from "@/lib/library/service"
import { requireLibraryUser } from "@/lib/require-auth"

export default async function LibraryPage({
	searchParams,
}: {
	searchParams: Promise<{ folder?: string }>
}) {
	const viewer = await requireLibraryUser()
	if (!viewer) redirect("/login")

	const { folder: folderParam } = await searchParams
	const folderId = folderParam ? Number(folderParam) : null
	if (folderId !== null && !Number.isInteger(folderId)) notFound()

	const result = await getFolderView(db, viewer, folderId)
	if (!result.ok) notFound()
	const { tree, folder, path, subfolders, files } = result.data

	const canNestHere = path.length < MAX_FOLDER_DEPTH
	const emptyMessage = folder
		? "No documents yet. Upload one."
		: viewer.isDocumentAdmin
			? "No folders yet. Create one to get started."
			: "No folders yet."

	return (
		<div className="mx-auto max-w-7xl">
			<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
				<H1 variant="secondary">Library</H1>
				<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
					<LibrarySearchBox />
					{viewer.isDocumentAdmin && canNestHere && <NewFolderDialog parentId={folderId} />}
					{viewer.isDocumentAdmin && (
						<Button variant="ghost" asChild>
							<Link href="/library/trash">
								<Trash2 className="h-4 w-4" />
								Trash
							</Link>
						</Button>
					)}
					{folder && <UploadDialog folderId={folder.id} folderName={folder.name} />}
					{viewer.isDocumentAdmin && folder && <FolderMenu folder={folder} tree={tree} />}
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-[16rem_1fr]">
				<Card className="hidden self-start md:block">
					<CardContent className="p-3">
						<FolderTree folders={tree} currentId={folderId} openIds={path.map((p) => p.id)} />
					</CardContent>
				</Card>

				<section className="min-w-0 space-y-3">
					<LibraryBreadcrumb path={path} />
					{folder?.isRestricted && (
						<p className="flex items-center gap-2 text-sm text-amber-700">
							<Lock className="h-4 w-4" aria-hidden />
							Restricted folder: only chosen members can see it.
						</p>
					)}
					<FolderContents subfolders={subfolders} files={files} emptyMessage={emptyMessage} />
				</section>
			</div>
		</div>
	)
}
