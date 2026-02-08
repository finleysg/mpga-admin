import { mergeAttributes, Node, wrappingInputRule } from "@tiptap/react"
import containerPlugin from "markdown-it-container"

export type AdmonitionType = "note" | "warning" | "tip" | "danger"

const ADMONITION_TYPES: AdmonitionType[] = ["note", "warning", "tip", "danger"]

declare module "@tiptap/react" {
	interface Commands<ReturnType> {
		admonition: {
			setAdmonition: (attrs: { type: AdmonitionType }) => ReturnType
			toggleAdmonition: (attrs: { type: AdmonitionType }) => ReturnType
			unsetAdmonition: () => ReturnType
		}
	}
}

export const Admonition = Node.create({
	name: "admonition",
	group: "block",
	content: "block+",
	defining: true,

	addAttributes() {
		return {
			type: {
				default: "note" as AdmonitionType,
				parseHTML: (element: HTMLElement) => element.getAttribute("data-type") ?? "note",
				renderHTML: (attributes: Record<string, string>) => ({
					"data-type": attributes.type,
				}),
			},
		}
	},

	parseHTML() {
		return [{ tag: "div[data-admonition]" }]
	},

	renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
		return [
			"div",
			mergeAttributes(
				{
					"data-admonition": "",
					class: `admonition admonition-${HTMLAttributes["data-type"] ?? "note"}`,
				},
				HTMLAttributes,
			),
			0,
		]
	},

	addCommands() {
		return {
			setAdmonition:
				(attrs) =>
				({ commands }) =>
					commands.wrapIn(this.name, attrs),
			toggleAdmonition:
				(attrs) =>
				({ commands, editor }) => {
					if (editor.isActive(this.name, attrs)) {
						return commands.lift(this.name)
					}
					if (editor.isActive(this.name)) {
						return commands.updateAttributes(this.name, { type: attrs.type })
					}
					return commands.wrapIn(this.name, attrs)
				},
			unsetAdmonition:
				() =>
				({ commands }) =>
					commands.lift(this.name),
		}
	},

	addInputRules() {
		return ADMONITION_TYPES.map((type) =>
			wrappingInputRule({
				find: new RegExp(`^:::${type}\\s$`),
				type: this.type,
				getAttributes: () => ({ type }),
			}),
		)
	},

	addStorage() {
		return {
			markdown: {
				serialize(
					state: {
						write: (text: string) => void
						ensureNewLine: () => void
						renderContent: (node: { content: unknown }) => void
						closeBlock: (node: unknown) => void
					},
					node: { attrs: { type: string }; content: unknown },
				) {
					state.write(`:::${node.attrs.type}\n`)
					state.renderContent(node)
					state.ensureNewLine()
					state.write(":::")
					state.closeBlock(node)
				},
				parse: {
					setup(md: { use: (plugin: unknown, name: string, opts: unknown) => void }) {
						for (const type of ADMONITION_TYPES) {
							md.use(containerPlugin, type, {
								render(tokens: Array<{ nesting: number }>, idx: number) {
									if (tokens[idx]!.nesting === 1) {
										return `<div data-admonition data-type="${type}" class="admonition admonition-${type}">\n`
									}
									return "</div>\n"
								},
							})
						}
					},
				},
			},
		}
	},
})
