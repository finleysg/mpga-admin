import { Highlight } from "@tiptap/extension-highlight"
import markPlugin from "markdown-it-mark"

export const HighlightWithMarkdown = Highlight.extend({
	addStorage() {
		return {
			markdown: {
				serialize: { open: "==", close: "==", mixable: true, expelEnclosingWhitespace: true },
				parse: {
					setup(md: { use: (plugin: unknown) => void }) {
						md.use(markPlugin)
					},
				},
			},
		}
	},
})
