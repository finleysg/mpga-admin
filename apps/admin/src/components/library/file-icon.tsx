import { File, FileImage, FileSpreadsheet, FileText, Presentation } from "lucide-react"

import { fileTypeInfo } from "@/lib/library/file-types"

export function FileIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
	const label = fileTypeInfo(name)?.label
	const props = { className: `${className} shrink-0 text-secondary-500`, "aria-hidden": true }
	switch (label) {
		case "Excel":
		case "CSV":
			return <FileSpreadsheet {...props} />
		case "PowerPoint":
			return <Presentation {...props} />
		case "Image":
			return <FileImage {...props} />
		case "PDF":
		case "Word":
		case "Text":
		case "Markdown":
			return <FileText {...props} />
		default:
			return <File {...props} />
	}
}
