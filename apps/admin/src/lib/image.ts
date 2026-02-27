export async function processImage(buffer: Buffer): Promise<Buffer> {
	const sharp = (await import("sharp")).default
	return sharp(buffer)
		.resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
		.jpeg({ quality: 85 })
		.toBuffer()
}
