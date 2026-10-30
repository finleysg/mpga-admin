import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table"
import { DOMSerializer, type Node } from "@tiptap/pm/model"

interface TableSerializerState {
	out: string
	inTable: boolean
	write(text: string): void
	closeBlock(node: Node): void
	renderInline(node: Node): void
	ensureNewLine(): void
}

const alignment = {
	default: null,
	parseHTML: (element: HTMLElement) => element.style.textAlign || element.getAttribute("align"),
	renderHTML: (attributes: Record<string, unknown>) =>
		["left", "center", "right"].includes(String(attributes.align))
			? { style: `text-align: ${attributes.align}` }
			: {},
}

function serialize(state: TableSerializerState, node: Node) {
	const rows = Array.from({ length: node.childCount }, (_, i) => node.child(i))
	const simple = rows.every((row, i) =>
		Array.from({ length: row.childCount }, (_, j) => row.child(j)).every(
			(cell) =>
				cell.type.name === (i === 0 ? "tableHeader" : "tableCell") &&
				cell.attrs.colspan === 1 &&
				cell.attrs.rowspan === 1 &&
				cell.childCount === 1 &&
				cell.firstChild?.type.name === "paragraph",
		),
	)
	if (!simple) {
		// Preserve pasted merged cells or multiple paragraphs as HTML, which the renderer sanitizes.
		const table = DOMSerializer.fromSchema(node.type.schema).serializeNode(node) as HTMLElement
		state.write(table.outerHTML)
		state.closeBlock(node)
		return
	}
	const output = state
	output.inTable = true
	rows.forEach((row, i) => {
		state.write("| ")
		row.forEach((cell, _offset, column) => {
			if (column) state.write(" | ")
			const start = output.out.length
			state.renderInline(cell.firstChild!)
			// Escape pipes even inside inline code/links so they cannot become delimiters.
			output.out = output.out.slice(0, start) + output.out.slice(start).replace(/\|/g, "\\|")
		})
		state.write(" |")
		state.ensureNewLine()
		if (!i) {
			const separators = Array.from({ length: row.childCount }, (_, j) => {
				const align = row.child(j).attrs.align
				return align === "center"
					? ":---:"
					: align === "right"
						? "---:"
						: align === "left"
							? ":---"
							: "---"
			})
			state.write(`| ${separators.join(" | ")} |`)
			state.ensureNewLine()
		}
	})
	output.inTable = false
	state.closeBlock(node)
}

export const tableExtensions = [
	Table.extend({ addStorage: () => ({ markdown: { serialize } }) }).configure({
		resizable: false,
		renderWrapper: true,
	}),
	TableRow,
	TableHeader.extend({
		addAttributes() {
			return { ...this.parent?.(), align: alignment }
		},
	}),
	TableCell.extend({
		addAttributes() {
			return { ...this.parent?.(), align: alignment }
		},
	}),
]
