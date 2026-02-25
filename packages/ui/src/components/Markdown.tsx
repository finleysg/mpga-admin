import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import remarkDirective from "remark-directive"
import remarkGfm from "remark-gfm"
import { visit } from "unist-util-visit"

import { cn } from "../lib/utils"

export interface MarkdownProps {
	content: string
	className?: string
}

export const ADMONITION_TYPES = new Set(["note", "warning", "tip", "danger"])

/** Remark plugin that converts :::note / :::tip / etc. container directives into div elements
 *  and preserves unrecognized text/leaf directives as plain text (e.g. `:30` in "12:30 pm"). */
function remarkAdmonitions() {
	return (tree: Parameters<typeof visit>[0]) => {
		visit(tree, (node) => {
			if (node.type === "containerDirective") {
				const directive = node as {
					type: string
					name: string
					data?: Record<string, unknown>
				}
				if (!ADMONITION_TYPES.has(directive.name)) return

				const data = (directive.data ??= {})
				data.hName = "div"
				data.hProperties = {
					dataAdmonition: "",
					dataType: directive.name,
					className: `admonition admonition-${directive.name}`,
				}
				return
			}

			if (node.type === "textDirective" || node.type === "leafDirective") {
				const directive = node as {
					type: string
					name: string
					children: { value: string }[]
				}
				const childText = directive.children.map((c) => c.value ?? "").join("")
				Object.assign(node, {
					type: "text",
					value: `:${directive.name}${childText ? `[${childText}]` : ""}`,
					children: undefined,
				})
			}
		})
	}
}

/** Extend the default GitHub sanitize schema to allow mark tags and admonition div attributes. */
const sanitizeSchema = {
	...defaultSchema,
	tagNames: [...(defaultSchema.tagNames ?? []), "mark"],
	attributes: {
		...defaultSchema.attributes,
		div: [...(defaultSchema.attributes?.div ?? []), "dataAdmonition", "dataType", "className"],
		mark: [],
	},
}

/**
 * Pre-process ==text== highlight syntax into <mark> tags.
 * This handles the highlight markdown syntax since remark has no maintained == plugin.
 * rehype-raw will parse the resulting HTML tags.
 */
export function preprocessHighlights(markdown: string): string {
	return markdown.replace(/==((?:(?!==).)+)==/g, "<mark>$1</mark>")
}

export function Markdown({ content, className }: MarkdownProps) {
	const processed = preprocessHighlights(content)
	return (
		<div className={cn("prose", className)}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm, remarkDirective, remarkAdmonitions]}
				rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
			>
				{processed}
			</ReactMarkdown>
		</div>
	)
}
