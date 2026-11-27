import { type NextRequest, NextResponse } from "next/server"

import {
	contentDisposition,
	decodeLocalToken,
	getLibraryStorage,
	type LocalLibraryStorage,
} from "@/lib/library/storage"

// Serves files from the local development storage. The token was issued by getDownloadUrl after
// its permission check and expires like a presigned S3 link. Disabled when S3 is configured.
export async function GET(request: NextRequest) {
	// Compare by tag, not instanceof: route handlers and server actions are bundled separately,
	// so the shared instance may come from another copy of the class.
	const storage = getLibraryStorage()
	if (storage.kind !== "local") {
		return new NextResponse("Not found", { status: 404 })
	}
	const local = storage as LocalLibraryStorage
	const object = decodeLocalToken(request.nextUrl.searchParams.get("token") ?? "")
	if (!object) {
		return new NextResponse("This link has expired. Go back and open the file again.", {
			status: 403,
		})
	}
	try {
		const body = await local.read(object.key)
		return new NextResponse(new Uint8Array(body), {
			headers: {
				"Content-Type": object.contentType,
				"Content-Disposition": contentDisposition(object.disposition, object.fileName),
				"Cache-Control": "private, no-store",
				"X-Content-Type-Options": "nosniff",
			},
		})
	} catch {
		return new NextResponse("Not found", { status: 404 })
	}
}
