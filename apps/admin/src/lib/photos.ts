import { photo, phototag } from "@mpga/database"
import { desc, eq } from "drizzle-orm"

import { db } from "./db"
import { processImage } from "./image"
import { deleteFromS3, uploadToS3 } from "./s3"

export interface PhotoData {
	id: number
	photoType: string
	year: number
	rawImage: string
	caption: string
	tournamentId: number | null
}

export interface SavePhotoInput {
	id?: number
	caption: string
	photoType: string
	year: number
	tournamentId: number
}

export async function listPhotos(tournamentId: number): Promise<PhotoData[]> {
	return db
		.select({
			id: photo.id,
			photoType: photo.photoType,
			year: photo.year,
			rawImage: photo.rawImage,
			caption: photo.caption,
			tournamentId: photo.tournamentId,
		})
		.from(photo)
		.where(eq(photo.tournamentId, tournamentId))
		.orderBy(desc(photo.year))
}

export async function savePhoto(data: SavePhotoInput, userId: string): Promise<number> {
	const now = new Date().toISOString().replace("T", " ").replace("Z", "")

	if (data.id !== undefined) {
		await db
			.update(photo)
			.set({
				caption: data.caption.trim(),
				photoType: data.photoType,
				year: data.year,
				lastUpdate: now,
			})
			.where(eq(photo.id, data.id))
		return data.id
	}

	const result = await db.insert(photo).values({
		caption: data.caption.trim(),
		photoType: data.photoType,
		year: data.year,
		tournamentId: data.tournamentId,
		rawImage: "",
		lastUpdate: now,
		createdBy: userId,
	})
	return result[0].insertId
}

export async function uploadPhotoImage(file: File, photoId: number, year: number): Promise<string> {
	const buffer = Buffer.from(await file.arrayBuffer())
	const processed = await processImage(buffer)
	const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^.]+$/, ".jpg")
	const key = `photos/${year}/${Date.now()}-${safeName}`
	await uploadToS3(processed, key, "image/jpeg")

	const now = new Date().toISOString().replace("T", " ").replace("Z", "")
	await db.update(photo).set({ rawImage: key, lastUpdate: now }).where(eq(photo.id, photoId))

	return key
}

export async function deletePhoto(id: number): Promise<void> {
	const [row] = await db.select({ rawImage: photo.rawImage }).from(photo).where(eq(photo.id, id))
	if (row?.rawImage) {
		try {
			await deleteFromS3(row.rawImage)
		} catch (err) {
			console.warn("Failed to delete S3 object for photo:", err)
		}
	}

	await db.transaction(async (tx) => {
		await tx.delete(phototag).where(eq(phototag.photoId, id))
		await tx.delete(photo).where(eq(photo.id, id))
	})
}
