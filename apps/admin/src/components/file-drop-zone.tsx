"use client"

import { Upload } from "lucide-react"
import { useRef, useState } from "react"

interface FileDropZoneProps {
	label?: string
	file?: File
	onFileChange: (file: File | undefined) => void
	accept?: string
	placeholder?: string
}

export function FileDropZone({
	file,
	onFileChange,
	accept,
	placeholder = "Drag and drop a file here, or click to browse",
}: FileDropZoneProps) {
	const inputRef = useRef<HTMLInputElement>(null)
	const [dragOver, setDragOver] = useState(false)

	return (
		<>
			<input
				ref={inputRef}
				type="file"
				accept={accept}
				className="hidden"
				onChange={(e) => {
					const f = e.target.files?.[0]
					onFileChange(f ?? undefined)
				}}
			/>
			<div
				role="button"
				tabIndex={0}
				className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border-2 border-dashed p-4 transition-colors ${
					dragOver
						? "border-secondary-500 bg-secondary-50"
						: "border-muted-foreground/25 hover:border-secondary-300"
				}`}
				onClick={() => inputRef.current?.click()}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault()
						inputRef.current?.click()
					}
				}}
				onDragOver={(e) => {
					e.preventDefault()
					setDragOver(true)
				}}
				onDragLeave={() => setDragOver(false)}
				onDrop={(e) => {
					e.preventDefault()
					setDragOver(false)
					const f = e.dataTransfer.files[0]
					if (f) {
						onFileChange(f)
					}
				}}
			>
				{file ? (
					<span className="text-sm text-foreground">{file.name}</span>
				) : (
					<>
						<Upload className="h-5 w-5 text-muted-foreground" />
						<span className="text-sm text-muted-foreground">{placeholder}</span>
					</>
				)}
			</div>
		</>
	)
}
