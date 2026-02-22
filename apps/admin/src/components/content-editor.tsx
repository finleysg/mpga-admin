"use client"

import type { ActionResult } from "@mpga/types"
import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	ContentCard,
	FieldLabel,
	Input,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	Skeleton,
	toast,
} from "@mpga/ui"
import { ArrowLeft, Eye, Loader2, Monitor, Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { MarkdownEditor } from "./markdown-editor"

interface ContentEditorProps {
	backHref?: string
	loadContent: () => Promise<{ title: string; content: string; id?: number } | null>
	saveContent: (data: {
		id?: number
		title: string
		content: string
	}) => Promise<ActionResult<{ id: number }>>
	showTitle?: boolean
	preview?: {
		heading: "h1" | "h2" | "h3" | "h4"
		variant?: "primary" | "secondary"
	}
}

export function ContentEditor({
	backHref,
	loadContent,
	saveContent,
	showTitle = true,
	preview,
}: ContentEditorProps) {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [title, setTitle] = useState("")
	const [contentId, setContentId] = useState<number | undefined>()
	const [markdownContent, setMarkdownContent] = useState("")
	const [previewOpen, setPreviewOpen] = useState(false)
	const [previewMobile, setPreviewMobile] = useState(false)
	const savedState = useRef({ title: "", content: "" })

	const loaded = useRef(false)

	useEffect(() => {
		async function load() {
			if (loaded.current) return
			loaded.current = true
			const data = await loadContent()
			if (data) {
				setTitle(data.title)
				setContentId(data.id)
				setMarkdownContent(data.content)
				savedState.current = { title: data.title, content: data.content }
			}
			setLoading(false)
		}
		load()
	}, [loadContent])

	const handleSave = useCallback(async () => {
		setSaving(true)
		try {
			const result = await saveContent({
				id: contentId,
				title: title.trim(),
				content: markdownContent,
			})

			if (result.success) {
				toast.success("Content saved")
				savedState.current = { title: title.trim(), content: markdownContent }
				if (result.data) {
					setContentId(result.data.id)
				}
			} else {
				toast.error(result.error ?? "Failed to save content")
			}
		} catch {
			toast.error("Failed to save content")
		} finally {
			setSaving(false)
		}
	}, [contentId, title, markdownContent, saveContent])

	const isDirty = useCallback(() => {
		return (
			title.trim() !== savedState.current.title || markdownContent !== savedState.current.content
		)
	}, [title, markdownContent])

	const handleBack = useCallback(() => {
		if (!backHref) return
		if (isDirty()) {
			if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
				return
			}
		}
		router.push(backHref)
	}, [isDirty, router, backHref])

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-10 w-full" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-100 w-full" />
				</CardContent>
			</Card>
		)
	}

	return (
		<>
			<Card>
				<div className="sticky top-0 z-10 rounded-t-lg bg-card">
					<div className="flex pb-2">
						<div className="w-[70%]">
							<CardHeader>
								<CardTitle>
									{showTitle ? (
										<>
											<FieldLabel htmlFor="content-title">Title</FieldLabel>
											<Input
												id="content-title"
												value={title}
												onChange={(e) => setTitle(e.target.value)}
												placeholder="Title"
												className="text-lg font-semibold"
											/>
										</>
									) : (
										<span className="text-lg font-semibold">{title}</span>
									)}
								</CardTitle>
							</CardHeader>
						</div>
						<div className="flex w-[30%] items-center justify-end gap-2 pr-6">
							{backHref && (
								<Button variant="secondaryoutline" onClick={handleBack} disabled={saving}>
									<ArrowLeft className="h-4 w-4" />
									Back
								</Button>
							)}
							{preview && (
								<Button variant="secondaryoutline" onClick={() => setPreviewOpen(true)}>
									<Eye className="h-4 w-4" />
									Preview
								</Button>
							)}
							<Button
								variant="secondary"
								onClick={handleSave}
								disabled={saving || (showTitle && !title.trim())}
							>
								{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Save
							</Button>
						</div>
					</div>
				</div>
				<CardContent>
					<MarkdownEditor value={markdownContent} onChange={setMarkdownContent} />
				</CardContent>
			</Card>

			{preview && (
				<Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
					<SheetContent className="overflow-y-auto sm:max-w-2xl">
						<SheetHeader>
							<SheetTitle>Preview</SheetTitle>
							<SheetDescription>
								Preview how this content appears on the public site.
							</SheetDescription>
							<div className="flex justify-center">
								<div className="inline-flex rounded-md border">
									<button
										type="button"
										onClick={() => setPreviewMobile(false)}
										className={`flex items-center gap-1.5 rounded-l-md px-3 py-1.5 text-sm transition-all duration-150 ${
											!previewMobile
												? "bg-secondary-500 text-white"
												: "text-muted-foreground hover:bg-secondary-100 hover:text-secondary-700"
										}`}
									>
										<Monitor className="h-4 w-4" />
										Desktop
									</button>
									<button
										type="button"
										onClick={() => setPreviewMobile(true)}
										className={`flex items-center gap-1.5 rounded-r-md px-3 py-1.5 text-sm transition-all duration-150 ${
											previewMobile
												? "bg-secondary-500 text-white"
												: "text-muted-foreground hover:bg-secondary-100 hover:text-secondary-700"
										}`}
									>
										<Smartphone className="h-4 w-4" />
										Mobile
									</button>
								</div>
							</div>
						</SheetHeader>
						<div
							className={
								previewMobile
									? "mx-auto mt-4 w-100 origin-top scale-[0.85] rounded-2xl border-4 border-gray-300"
									: "mt-4"
							}
						>
							<ContentCard
								heading={preview.heading}
								variant={preview.variant}
								title={title}
								content={markdownContent}
							/>
						</div>
					</SheetContent>
				</Sheet>
			)}
		</>
	)
}
