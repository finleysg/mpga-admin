import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const s3 = new S3Client({
	region: process.env.S3_REGION ?? "us-west-2",
})

export async function uploadToS3(buffer: Buffer, key: string, contentType: string) {
	const bucket = process.env.S3_BUCKET_NAME ?? "mpgagolf"
	const prefix = process.env.S3_MEDIA_PREFIX ?? "media"
	const fullKey = `${prefix}/${key}`

	await s3.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: fullKey,
			Body: buffer,
			ContentType: contentType,
		}),
	)

	return fullKey
}
