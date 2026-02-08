"use client"

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	FieldLabel,
	Input,
	Skeleton,
	Textarea,
	toast,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@mpga/ui"
import Link from "@tiptap/extension-link"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
	AlertTriangle,
	ArrowLeft,
	Bold,
	ChevronDown,
	Code,
	Eye,
	Heading2,
	Heading3,
	Heading4,
	Highlighter,
	Info,
	Italic,
	Lightbulb,
	Link as LinkIcon,
	List,
	ListOrdered,
	Loader2,
	Minus,
	RemoveFormatting,
	ShieldAlert,
	TextQuote,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { Markdown } from "tiptap-markdown"

import { Admonition, type AdmonitionType } from "@/lib/tiptap/admonition"
import { HighlightWithMarkdown } from "@/lib/tiptap/highlight"

interface ActionResult<T = void> {
	success: boolean
	error?: string
	data?: T
}

interface ContentEditorProps {
	backHref: string
	loadContent: () => Promise<{ title: string; content: string; id?: number } | null>
	saveContent: (data: {
		id?: number
		title: string
		content: string
	}) => Promise<ActionResult<{ id: number }>>
	showTitle?: boolean
}

export function ContentEditor({
	backHref,
	loadContent,
	saveContent,
	showTitle = true,
}: ContentEditorProps) {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [title, setTitle] = useState("")
	const [contentId, setContentId] = useState<number | undefined>()
	const [mode, setMode] = useState<"wysiwyg" | "markdown">("wysiwyg")
	const [markdownText, setMarkdownText] = useState("")
	const savedState = useRef({ title: "", content: "" })

	const editor = useEditor({
		extensions: [
			StarterKit,
			Markdown,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: {
					class: "text-primary underline",
				},
			}),
			HighlightWithMarkdown,
			Admonition,
		],
		immediatelyRender: false,
		editorProps: {
			attributes: {
				class: "prose min-h-[400px] p-4 focus:outline-none",
			},
		},
	})

	useEffect(() => {
		async function load() {
			const data = await loadContent()
			if (data) {
				setTitle(data.title)
				setContentId(data.id)
				savedState.current = { title: data.title, content: data.content }
				if (editor) {
					editor.commands.setContent(data.content)
				}
			}
			setLoading(false)
		}
		if (editor) {
			load()
		}
	}, [editor, loadContent])

	const switchToMarkdown = useCallback(() => {
		if (!editor) return
		const md = editor.storage.markdown.getMarkdown() as string
		setMarkdownText(md)
		setMode("markdown")
	}, [editor])

	const switchToWysiwyg = useCallback(() => {
		if (!editor) return
		editor.commands.setContent(markdownText)
		setMode("wysiwyg")
	}, [editor, markdownText])

	const handleSave = useCallback(async () => {
		if (!editor) return

		setSaving(true)
		try {
			const markdownContent =
				mode === "markdown" ? markdownText : (editor.storage.markdown.getMarkdown() as string)
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
	}, [editor, contentId, title, mode, markdownText, saveContent])

	const isDirty = useCallback(() => {
		if (!editor) return false
		const currentContent =
			mode === "markdown" ? markdownText : (editor.storage.markdown.getMarkdown() as string)
		return (
			title.trim() !== savedState.current.title || currentContent !== savedState.current.content
		)
	}, [editor, title, mode, markdownText])

	const handleBack = useCallback(() => {
		if (isDirty()) {
			if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
				return
			}
		}
		router.push(backHref)
	}, [isDirty, router, backHref])

	const setLink = useCallback(() => {
		if (!editor) return

		const previousUrl = editor.getAttributes("link").href as string
		const url = window.prompt("URL", previousUrl)

		if (url === null) return

		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run()
			return
		}

		editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
	}, [editor])

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-10 w-full" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-[400px] w-full" />
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<div className="sticky top-0 z-10 rounded-t-lg bg-card">
				<div className="flex pb-2">
					<div className="w-[70%]">
						<CardHeader>
							<CardTitle>
								{showTitle ? (
									<>
										<FieldLabel htmlFor="content-title">Title (h2)</FieldLabel>
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
						<Button variant="secondaryoutline" onClick={handleBack} disabled={saving}>
							<ArrowLeft className="h-4 w-4" />
							Back
						</Button>
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
				{editor && (
					<div className="px-6 pb-4">
						<TooltipProvider delayDuration={2000}>
							<div className="flex items-center gap-1 rounded-md border-2 border-secondary-500 bg-muted/50 p-1">
								{mode === "wysiwyg" && (
									<>
										<ToolbarButton
											onClick={() => editor.chain().focus().toggleBold().run()}
											active={editor.isActive("bold")}
											title="Bold"
										>
											<Bold className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarButton
											onClick={() => editor.chain().focus().toggleItalic().run()}
											active={editor.isActive("italic")}
											title="Italic"
										>
											<Italic className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarButton
											onClick={() => editor.chain().focus().toggleHighlight().run()}
											active={editor.isActive("highlight")}
											title="Highlight"
										>
											<Highlighter className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarSeparator />
										<ToolbarButton
											onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
											active={editor.isActive("heading", { level: 2 })}
											title="Heading 2"
										>
											<Heading2 className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarButton
											onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
											active={editor.isActive("heading", { level: 3 })}
											title="Heading 3"
										>
											<Heading3 className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarButton
											onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
											active={editor.isActive("heading", { level: 4 })}
											title="Heading 4"
										>
											<Heading4 className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarSeparator />
										<ToolbarButton
											onClick={() => editor.chain().focus().toggleBulletList().run()}
											active={editor.isActive("bulletList")}
											title="Bullet list"
										>
											<List className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarButton
											onClick={() => editor.chain().focus().toggleOrderedList().run()}
											active={editor.isActive("orderedList")}
											title="Ordered list"
										>
											<ListOrdered className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarSeparator />
										<ToolbarButton
											onClick={() => editor.chain().focus().toggleBlockquote().run()}
											active={editor.isActive("blockquote")}
											title="Block quote"
										>
											<TextQuote className="h-4 w-4" />
										</ToolbarButton>
										<AdmonitionDropdown
											onSelect={(type) => editor.chain().focus().toggleAdmonition({ type }).run()}
											active={editor.isActive("admonition")}
										/>
										<ToolbarSeparator />
										<ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
											<LinkIcon className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarButton
											onClick={() => editor.chain().focus().setHorizontalRule().run()}
											title="Horizontal rule"
										>
											<Minus className="h-4 w-4" />
										</ToolbarButton>
										<ToolbarSeparator />
										<ToolbarButton
											onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
											title="Clear formatting"
										>
											<RemoveFormatting className="h-4 w-4" />
										</ToolbarButton>
									</>
								)}
								<div className="ml-auto flex">
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={mode === "markdown" ? switchToWysiwyg : undefined}
												className={`cursor-pointer rounded-l-md p-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
													mode === "wysiwyg"
														? "bg-secondary-500 text-white"
														: "text-muted-foreground hover:bg-secondary-100 hover:text-secondary-700"
												}`}
											>
												<Eye className="h-4 w-4" />
											</button>
										</TooltipTrigger>
										<TooltipContent>WYSIWYG</TooltipContent>
									</Tooltip>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={mode === "wysiwyg" ? switchToMarkdown : undefined}
												className={`cursor-pointer rounded-r-md p-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
													mode === "markdown"
														? "bg-secondary-500 text-white"
														: "text-muted-foreground hover:bg-secondary-100 hover:text-secondary-700"
												}`}
											>
												<Code className="h-4 w-4" />
											</button>
										</TooltipTrigger>
										<TooltipContent>Markdown</TooltipContent>
									</Tooltip>
								</div>
							</div>
						</TooltipProvider>
					</div>
				)}
			</div>
			<CardContent>
				{mode === "wysiwyg" ? (
					<div className="rounded-md border border-gray-300">
						<EditorContent editor={editor} />
					</div>
				) : (
					<Textarea
						value={markdownText}
						onChange={(e) => setMarkdownText(e.target.value)}
						className="min-h-[400px] resize-none p-4 font-mono text-sm"
					/>
				)}
			</CardContent>
		</Card>
	)
}

function ToolbarButton({
	onClick,
	active,
	title,
	children,
}: {
	onClick: () => void
	active?: boolean
	title: string
	children: React.ReactNode
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					onClick={onClick}
					className={`cursor-pointer rounded p-2 transition-all duration-150 hover:bg-secondary-100 hover:text-secondary-700 active:scale-90 active:bg-secondary-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
						active ? "bg-muted text-primary" : "text-muted-foreground"
					}`}
				>
					{children}
				</button>
			</TooltipTrigger>
			<TooltipContent>{title}</TooltipContent>
		</Tooltip>
	)
}

function ToolbarSeparator() {
	return <div className="mx-1 w-px self-stretch bg-border" />
}

const admonitionItems: { type: AdmonitionType; label: string; icon: React.ReactNode }[] = [
	{ type: "note", label: "Note", icon: <Info className="h-4 w-4 text-blue-500" /> },
	{ type: "tip", label: "Tip", icon: <Lightbulb className="h-4 w-4 text-green-500" /> },
	{ type: "warning", label: "Warning", icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
	{ type: "danger", label: "Danger", icon: <ShieldAlert className="h-4 w-4 text-red-500" /> },
]

function AdmonitionDropdown({
	onSelect,
	active,
}: {
	onSelect: (type: AdmonitionType) => void
	active: boolean
}) {
	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className={`flex cursor-pointer items-center gap-0.5 rounded p-2 transition-all duration-150 hover:bg-secondary-100 hover:text-secondary-700 active:scale-90 active:bg-secondary-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
								active ? "bg-muted text-primary" : "text-muted-foreground"
							}`}
						>
							<Info className="h-4 w-4" />
							<ChevronDown className="h-3 w-3" />
						</button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>Callout block</TooltipContent>
			</Tooltip>
			<DropdownMenuContent align="start">
				{admonitionItems.map((item) => (
					<DropdownMenuItem key={item.type} onClick={() => onSelect(item.type)}>
						{item.icon}
						<span className="ml-2">{item.label}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
