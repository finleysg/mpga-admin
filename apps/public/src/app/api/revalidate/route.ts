import { revalidatePath } from "next/cache"
import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
	const secret = request.headers.get("x-revalidate-secret")
	const path = request.nextUrl.searchParams.get("path") || "/"
	const type = request.nextUrl.searchParams.get("type") as "page" | "layout" | null

	if (secret !== process.env.REVALIDATE_SECRET) {
		return Response.json({ message: "Invalid secret" }, { status: 401 })
	}

	if (type === "page" || type === "layout") {
		revalidatePath(path, type)
	} else {
		revalidatePath(path)
	}
	return Response.json({ revalidated: true, path, type })
}
