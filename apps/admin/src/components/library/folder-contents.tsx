import { EmptyState, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@mpga/ui"
import { ChevronRight, Folder, Lock } from "lucide-react"
import Link from "next/link"

import { formatBytes } from "@/lib/library/file-types"
import { fileHref, folderHref } from "@/lib/library/links"
import type { FileSummary, FolderSummary } from "@/lib/library/service"

import { FileIcon } from "./file-icon"
import { LocalDate } from "./local-date"

interface FolderContentsProps {
	subfolders: FolderSummary[]
	files: FileSummary[]
	emptyMessage: string
}

export function FolderContents({ subfolders, files, emptyMessage }: FolderContentsProps) {
	if (subfolders.length === 0 && files.length === 0) {
		return <EmptyState message={emptyMessage} />
	}

	return (
		<>
			{/* Laptop: table */}
			<div className="hidden md:block">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead className="w-36">Last updated</TableHead>
							<TableHead className="w-40">By</TableHead>
							<TableHead className="w-24 text-right">Size</TableHead>
							<TableHead className="w-24 text-right">Versions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{subfolders.map((f) => (
							<TableRow key={`folder-${f.id}`}>
								<TableCell colSpan={5}>
									<Link
										href={folderHref(f.id)}
										className="flex items-center gap-2 font-medium hover:underline"
									>
										<Folder className="h-5 w-5 shrink-0 text-secondary-500" aria-hidden />
										{f.name}
										{f.isRestricted && (
											<Lock className="h-3.5 w-3.5 text-amber-600" aria-label="Restricted" />
										)}
									</Link>
								</TableCell>
							</TableRow>
						))}
						{files.map((f) => (
							<TableRow key={`file-${f.id}`}>
								<TableCell>
									<Link href={fileHref(f.id)} className="flex items-center gap-2 hover:underline">
										<FileIcon name={f.name} />
										<span className="truncate">{f.name}</span>
									</Link>
								</TableCell>
								<TableCell>
									<LocalDate value={f.updatedAt} />
								</TableCell>
								<TableCell className="truncate">{f.updatedByName ?? "Former member"}</TableCell>
								<TableCell className="text-right">{formatBytes(f.size)}</TableCell>
								<TableCell className="text-right">{f.versionCount}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Phone: one column with large tap targets */}
			<ul className="divide-y rounded-md border md:hidden">
				{subfolders.map((f) => (
					<li key={`folder-${f.id}`}>
						<Link href={folderHref(f.id)} className="flex min-h-14 items-center gap-3 px-3 py-3">
							<Folder className="h-6 w-6 shrink-0 text-secondary-500" aria-hidden />
							<span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
							{f.isRestricted && (
								<Lock className="h-4 w-4 text-amber-600" aria-label="Restricted" />
							)}
							<ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
						</Link>
					</li>
				))}
				{files.map((f) => (
					<li key={`file-${f.id}`}>
						<Link href={fileHref(f.id)} className="flex min-h-14 items-center gap-3 px-3 py-3">
							<FileIcon name={f.name} className="h-6 w-6" />
							<span className="min-w-0 flex-1">
								<span className="block truncate">{f.name}</span>
								<span className="block text-xs text-muted-foreground">
									<LocalDate value={f.updatedAt} /> · {formatBytes(f.size)}
									{f.versionCount > 1 && ` · ${f.versionCount} versions`}
								</span>
							</span>
							<ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
						</Link>
					</li>
				))}
			</ul>
		</>
	)
}
