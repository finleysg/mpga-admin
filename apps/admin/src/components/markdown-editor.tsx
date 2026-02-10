"use client"

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Textarea,
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
	Minus,
	RemoveFormatting,
	ShieldAlert,
	TextQuote,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Markdown } from "tiptap-markdown"

import { Admonition, type AdmonitionType } from "@/lib/tiptap/admonition"
import { HighlightWithMarkdown } from "@/lib/tiptap/highlight"

interface MarkdownEditorProps {
	value: string
	onChange: (value: string) => void
	minHeight?: string
	maxHeight?: string
	className?: string
}

export function MarkdownEditor({
	value,
	onChange,
	minHeight = "400px",
	maxHeight,
	className,
}: MarkdownEditorProps) {
	const [mode, setMode] = useState<"wysiwyg" | "markdown">("wysiwyg")
	const [markdownText, setMarkdownText] = useState("")
	const lastEmittedRef = useRef(value)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const [measuredMaxHeight, setMeasuredMaxHeight] = useState<string | undefined>()

	// Dynamically measure available viewport space when no explicit maxHeight is provided
	useEffect(() => {
		if (maxHeight) return

		const updateMaxHeight = () => {
			const el = contentRef.current
			if (!el) return
			const top = el.getBoundingClientRect().top
			const available = window.innerHeight - top - 24
			setMeasuredMaxHeight(`${Math.max(200, available)}px`)
		}

		requestAnimationFrame(updateMaxHeight)
		window.addEventListener("resize", updateMaxHeight)
		return () => window.removeEventListener("resize", updateMaxHeight)
	}, [maxHeight, mode])

	const effectiveMaxHeight = maxHeight ?? measuredMaxHeight

	const autoResizeTextarea = useCallback(() => {
		const textarea = textareaRef.current
		if (!textarea) return
		textarea.style.height = "auto"
		textarea.style.height = `${textarea.scrollHeight}px`
	}, [])

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
				class: `prose tiptap-editor p-4 focus:outline-none`,
				style: `min-height: ${minHeight}`,
			},
		},
		onUpdate: ({ editor: ed }) => {
			const md = ed.storage.markdown.getMarkdown() as string
			lastEmittedRef.current = md
			onChange(md)
		},
	})

	// Set initial content once the editor is ready
	const initialized = useRef(false)
	useEffect(() => {
		if (editor && !initialized.current) {
			initialized.current = true
			editor.commands.setContent(value)
			lastEmittedRef.current = value
		}
	}, [editor, value])

	// Sync external value changes (e.g. when parent resets value)
	useEffect(() => {
		if (!editor || !initialized.current) return
		if (value !== lastEmittedRef.current) {
			lastEmittedRef.current = value
			editor.commands.setContent(value)
		}
	}, [editor, value])

	const switchToMarkdown = useCallback(() => {
		if (!editor) return
		const md = editor.storage.markdown.getMarkdown() as string
		setMarkdownText(md)
		setMode("markdown")
		requestAnimationFrame(autoResizeTextarea)
	}, [editor, autoResizeTextarea])

	const switchToWysiwyg = useCallback(() => {
		if (!editor) return
		editor.commands.setContent(markdownText)
		setMode("wysiwyg")
	}, [editor, markdownText])

	const handleMarkdownTextChange = useCallback(
		(text: string) => {
			setMarkdownText(text)
			lastEmittedRef.current = text
			onChange(text)
		},
		[onChange],
	)

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

	if (!editor) return null

	return (
		<div className={className}>
			<TooltipProvider delayDuration={1000}>
				<div className="flex items-center gap-1 rounded-t-md border border-gray-300 bg-secondary-50 p-1">
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
			<div ref={contentRef}>
				{mode === "wysiwyg" ? (
					<div
						className="markdown-editor-scroll overflow-y-auto rounded-b-md border-x border-b border-gray-300"
						style={{ maxHeight: effectiveMaxHeight }}
					>
						<EditorContent editor={editor} />
					</div>
				) : (
					<Textarea
						ref={textareaRef}
						value={markdownText}
						onChange={(e) => {
							handleMarkdownTextChange(e.target.value)
							requestAnimationFrame(autoResizeTextarea)
						}}
						className="markdown-editor-scroll resize-none overflow-y-auto rounded-t-none border-x border-b border-t-0 border-gray-300 p-4 font-mono text-sm"
						style={{ minHeight, maxHeight: effectiveMaxHeight }}
					/>
				)}
			</div>
		</div>
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
