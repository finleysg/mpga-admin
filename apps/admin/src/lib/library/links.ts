// URL helpers shared by server and client components.

export function folderHref(id: number | null) {
	return id === null ? "/library" : `/library?folder=${id}`
}

export function fileHref(id: number) {
	return `/library/file/${id}`
}
