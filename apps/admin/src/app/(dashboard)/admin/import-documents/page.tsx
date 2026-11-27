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
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { formatBytes } from "@/lib/library/file-types"
import { planImport } from "@/lib/library/import-documents"
import { getLibraryStorage } from "@/lib/library/storage"
import { requireSuperAdmin } from "@/lib/require-auth"

import { ImportRunner } from "./import-runner"

// The preview checks every file in the public bucket, so always run it fresh.
export const dynamic = "force-dynamic"

export default async function ImportDocumentsPage() {
	if (!(await requireSuperAdmin())) redirect("/")

	const plan = await planImport(db, getLibraryStorage())
	const ready = plan.items.filter((i) => i.status === "ready")
	const skipped = plan.items.filter((i) => i.status === "skip")

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			<div>
				<H1 variant="secondary">Import documents into the library</H1>
				<p className="mt-1 max-w-3xl text-sm text-muted-foreground">
					Copies the files of existing tournament, match play and other public documents into the
					board library, organised by tournament or type and year. Each document stays linked to its
					library copy, so public pages keep showing the same file. Nothing changes until you
					import.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>
						<H2 variant="secondary">Preview</H2>
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
						<div>
							<dt className="text-muted-foreground">Ready to import</dt>
							<dd className="font-heading text-2xl">{plan.ready}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Will be skipped</dt>
							<dd className="font-heading text-2xl">{plan.skipped}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Already imported</dt>
							<dd className="font-heading text-2xl">{plan.alreadyImported}</dd>
						</div>
						<div>
							<dt className="text-muted-foreground">Total size</dt>
							<dd className="font-heading text-2xl">
								{formatBytes(ready.reduce((sum, i) => sum + (i.size ?? 0), 0))}
							</dd>
						</div>
					</dl>
					{plan.byTopFolder.length > 0 && (
						<p className="text-sm">
							<span className="text-muted-foreground">Top-level folders: </span>
							{plan.byTopFolder.map((f) => `${f.folder} (${f.count})`).join(", ")}
						</p>
					)}
					<ImportRunner total={plan.ready + plan.skipped} />
				</CardContent>
			</Card>

			{skipped.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>
							<H2 variant="secondary">Will be skipped ({skipped.length})</H2>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Document</TableHead>
									<TableHead>Reason</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{skipped.map((i) => (
									<TableRow key={i.documentId}>
										<TableCell>
											{i.title}
											<span className="block text-xs text-muted-foreground">
												document {i.documentId}
											</span>
										</TableCell>
										<TableCell className="text-sm">{i.reason}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}

			{ready.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>
							<H2 variant="secondary">Ready to import ({ready.length})</H2>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Library location</TableHead>
									<TableHead>File name</TableHead>
									<TableHead className="w-24 text-right">Size</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{ready.map((i) => (
									<TableRow key={i.documentId}>
										<TableCell className="text-sm">{i.folderPath.join(" / ")}</TableCell>
										<TableCell className="text-sm">{i.fileName}</TableCell>
										<TableCell className="text-right text-sm">
											{i.size !== null ? formatBytes(i.size) : ""}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
