import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const s3 = new S3Client({
	region: process.env.S3_REGION ?? "us-west-2",
})

function getConfig() {
	const bucket = process.env.S3_BUCKET_NAME
	if (!bucket) {
		throw new Error("S3_BUCKET_NAME environment variable is not set")
	}
	const prefix = process.env.S3_MEDIA_PREFIX ?? "media"
	return { bucket, prefix }
}

export async function uploadToS3(buffer: Buffer, key: string, contentType: string) {
	const { bucket, prefix } = getConfig()
	const fullKey = `${prefix}/${key}`

	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: fullKey,
			Body: buffer,
			ContentType: contentType,
			CacheControl: "max-age=86400",
		}),
	)

	return fullKey
}

export async function deleteFromS3(key: string) {
	const { bucket, prefix } = getConfig()
	const fullKey = `${prefix}/${key}`

	await s3.send(
		new DeleteObjectCommand({
			Bucket: bucket,
			Key: fullKey,
		}),
	)
}
