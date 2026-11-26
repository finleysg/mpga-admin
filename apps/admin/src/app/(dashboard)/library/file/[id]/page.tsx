import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	H1,
	H2,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mpga/ui"
import { notFound, redirect } from "next/navigation"

import { FileMenu } from "@/components/library/admin-menus"
import {
	DownloadButton,
	RestoreVersionButton,
	UploadVersionDialog,
} from "@/components/library/file-actions"
import { FileIcon } from "@/components/library/file-icon"
import { LibraryBreadcrumb } from "@/components/library/library-breadcrumb"
import { LocalDate } from "@/components/library/local-date"
import { db } from "@/lib/db"
import { fileTypeInfo, formatBytes } from "@/lib/library/file-types"
import { getDownloadUrl, getFileView, getFolderView } from "@/lib/library/service"
import { getLibraryStorage } from "@/lib/library/storage"
import { requireLibraryUser } from "@/lib/require-auth"

export default async function LibraryFilePage({ params }: { params: Promise<{ id: string }> }) {
	const viewer = await requireLibraryUser()
	if (!viewer) redirect("/login")

	const fileId = Number((await params).id)
	if (!Number.isInteger(fileId)) notFound()
	const result = await getFileView(db, viewer, fileId)
	if (!result.ok) notFound()
	const file = result.data

	// Document admins get Move, which needs the folder tree.
	const tree = viewer.isDocumentAdmin
		? await getFolderView(db, viewer, null).then((v) => (v.ok ? v.data.tree : []))
		: []

	const info = fileTypeInfo(file.name)
	let previewUrl: string | null = null
	if (info?.inline) {
		const link = await getDownloadUrl(db, getLibraryStorage(), viewer, file.current.id, {
			preview: true,
		})
		if (link.ok && link.data.inline) previewUrl = link.data.url
	}

	return (
		<div className="mx-auto max-w-7xl space-y-4">
			<LibraryBreadcrumb path={file.path} current={file.name} />

			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<FileIcon name={file.name} className="h-8 w-8" />
					<H1 variant="secondary" className="break-words">
						{file.name}
					</H1>
				</div>
				<div className="flex flex-wrap gap-2">
					<DownloadButton versionId={file.current.id} />
					<UploadVersionDialog fileId={file.id} fileName={file.name} />
					{viewer.isDocumentAdmin && (
						<FileMenu
							file={{ id: file.id, name: file.name, folderId: file.folderId }}
							tree={tree}
						/>
					)}
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
				<Card className="min-w-0 gap-0 overflow-hidden py-0">
					{previewUrl && info?.label === "PDF" ? (
						<iframe
							src={previewUrl}
							title={`Preview of ${file.name}`}
							className="h-[75vh] w-full border-0"
						/>
					) : previewUrl ? (
						// eslint-disable-next-line @next/next/no-img-element -- short-lived private URL
						<img
							src={previewUrl}
							alt={file.name}
							className="mx-auto max-h-[75vh] object-contain p-4"
						/>
					) : (
						<CardContent className="flex flex-col items-center gap-4 py-16 text-center">
							<FileIcon name={file.name} className="h-16 w-16" />
							<p className="text-sm text-muted-foreground">
								{info?.label ?? "This"} files can&apos;t be previewed here.
							</p>
							<DownloadButton versionId={file.current.id} />
						</CardContent>
					)}
				</Card>

				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>
								<H2 variant="secondary">Details</H2>
							</CardTitle>
						</CardHeader>
						<CardContent>
							<dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
								<dt className="text-muted-foreground">Folder</dt>
								<dd>{file.path.map((p) => p.name).join(" / ")}</dd>
								<dt className="text-muted-foreground">Type</dt>
								<dd>{info?.label ?? "File"}</dd>
								<dt className="text-muted-foreground">Size</dt>
								<dd>{formatBytes(file.current.size)}</dd>
								<dt className="text-muted-foreground">Version</dt>
								<dd>v{file.current.versionNo}</dd>
								<dt className="text-muted-foreground">Uploaded</dt>
								<dd>
									{file.current.uploadedByName ?? "Former member"},{" "}
									<LocalDate value={file.current.uploadedAt} withTime />
								</dd>
							</dl>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>
								<H2 variant="secondary">Version history</H2>
							</CardTitle>
						</CardHeader>
						<CardContent className="px-2">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Version</TableHead>
										<TableHead>Uploaded</TableHead>
										<TableHead className="sr-only">Download</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{file.versions.map((v) => (
										<TableRow key={v.id}>
											<TableCell className="align-top font-medium">
												v{v.versionNo}
												{v.id === file.current.id && (
													<span className="block text-xs font-normal text-muted-foreground">
														Current
													</span>
												)}
											</TableCell>
											<TableCell className="align-top text-sm">
												<span className="block">{v.uploadedByName ?? "Former member"}</span>
												<span className="block text-xs text-muted-foreground">
													<LocalDate value={v.uploadedAt} /> · {formatBytes(v.size)}
													{v.restoredFromVersionNo &&
														` · restored from v${v.restoredFromVersionNo}`}
												</span>
											</TableCell>
											<TableCell className="text-right align-top">
												<div className="flex flex-col items-end gap-1">
													<DownloadButton
														versionId={v.id}
														label="Download"
														variant="ghost"
														size="sm"
													/>
													{viewer.isDocumentAdmin && v.id !== file.current.id && (
														<RestoreVersionButton
															fileId={file.id}
															versionId={v.id}
															versionNo={v.versionNo}
														/>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
