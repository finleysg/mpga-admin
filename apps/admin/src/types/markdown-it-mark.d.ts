declare module "markdown-it-mark" {
	import type MarkdownIt from "markdown-it"
	const markPlugin: MarkdownIt.PluginSimple
	export default markPlugin
}

declare module "markdown-it-container" {
	import type MarkdownIt from "markdown-it"
	const containerPlugin: MarkdownIt.PluginWithOptions
	export default containerPlugin
}
