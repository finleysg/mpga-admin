import crypto from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import { CopyObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/** Download and preview links stop working after this many seconds. */
export const SIGNED_URL_SECONDS = 300

export interface SignedUrlOptions {
	/** Name the browser saves the file as. */
	fileName: string
	contentType: string
	/** "inline" opens in the browser; only used for PDFs and images. */
	disposition: "inline" | "attachment"
}

/** Private storage for library files. */
export interface LibraryStorage {
	readonly kind: "s3" | "local" | "memory"
	put(key: string, body: Uint8Array, contentType: string): Promise<void>
	signedUrl(key: string, options: SignedUrlOptions): Promise<string>
	/** Copy a private object into the public media bucket (publishing). Returns the public key. */
	copyToPublic(key: string, publicKey: string, contentType: string): Promise<void>
}

export function newObjectKey(): string {
	return `library/${crypto.randomUUID()}`
}

export function contentDisposition(disposition: "inline" | "attachment", fileName: string): string {
	// Plain ASCII fallback plus RFC 5987 encoding for any other characters.
	const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_")
	return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`
}

// ---------- S3 ----------

class S3LibraryStorage implements LibraryStorage {
	readonly kind = "s3"
	private readonly client: S3Client

	constructor(
		private readonly bucket: string,
		region: string,
	) {
		this.client = new S3Client({ region })
	}

	async put(key: string, body: Uint8Array, contentType: string) {
		await this.client.send(
			new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType }),
		)
	}

	async signedUrl(key: string, options: SignedUrlOptions) {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
			ResponseContentType: options.contentType,
			ResponseContentDisposition: contentDisposition(options.disposition, options.fileName),
			ResponseCacheControl: "private, no-store",
		})
		return getSignedUrl(this.client, command, { expiresIn: SIGNED_URL_SECONDS })
	}

	async copyToPublic(key: string, publicKey: string, contentType: string) {
		const publicBucket = process.env.S3_BUCKET_NAME
		if (!publicBucket) throw new Error("S3_BUCKET_NAME environment variable is not set")
		await this.client.send(
			new CopyObjectCommand({
				Bucket: publicBucket,
				Key: publicKey,
				CopySource: `${this.bucket}/${key}`,
				ContentType: contentType,
				MetadataDirective: "REPLACE",
				CacheControl: "max-age=86400",
			}),
		)
	}
}

// ---------- Local fake (development) ----------

function signingSecret(): string {
	return process.env.BETTER_AUTH_SECRET ?? "mpga-library-local-dev-only"
}

function sign(payload: string): string {
	return crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url")
}

export interface LocalObjectRequest {
	key: string
	fileName: string
	contentType: string
	disposition: "inline" | "attachment"
	expires: number
}

export function encodeLocalToken(request: LocalObjectRequest): string {
	const payload = Buffer.from(JSON.stringify(request)).toString("base64url")
	return `${payload}.${sign(payload)}`
}

/** Returns the request if the token is authentic and unexpired, otherwise null. */
export function decodeLocalToken(token: string, now = Date.now()): LocalObjectRequest | null {
	const [payload, signature] = token.split(".")
	if (!payload || !signature) return null
	const expected = sign(payload)
	if (
		signature.length !== expected.length ||
		!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
	) {
		return null
	}
	try {
		const request = JSON.parse(Buffer.from(payload, "base64url").toString()) as LocalObjectRequest
		return request.expires > now ? request : null
	} catch {
		return null
	}
}

/**
 * Stores files on local disk and serves them through /api/library/local-object with signed,
 * expiring tokens, so development behaves like presigned S3 links. Never used in production.
 */
export class LocalLibraryStorage implements LibraryStorage {
	readonly kind = "local"

	constructor(private readonly root: string) {}

	private filePath(key: string): string {
		const resolved = path.resolve(this.root, key)
		if (!resolved.startsWith(path.resolve(this.root) + path.sep)) throw new Error("Invalid key")
		return resolved
	}

	async put(key: string, body: Uint8Array) {
		const file = this.filePath(key)
		await mkdir(path.dirname(file), { recursive: true })
		await writeFile(file, body)
	}

	async read(key: string): Promise<Buffer> {
		return readFile(this.filePath(key))
	}

	async signedUrl(key: string, options: SignedUrlOptions) {
		const token = encodeLocalToken({
			key,
			...options,
			expires: Date.now() + SIGNED_URL_SECONDS * 1000,
		})
		return `/api/library/local-object?token=${encodeURIComponent(token)}`
	}

	async copyToPublic(key: string, publicKey: string) {
		const target = this.filePath(`public/${publicKey}`)
		await mkdir(path.dirname(target), { recursive: true })
		await writeFile(target, await this.read(key))
	}
}

// ---------- In-memory fake (tests) ----------

export class MemoryLibraryStorage implements LibraryStorage {
	readonly kind = "memory"
	readonly objects = new Map<string, { body: Uint8Array; contentType: string }>()
	readonly published = new Map<string, string>()
	failNextPut = false

	async put(key: string, body: Uint8Array, contentType: string) {
		if (this.failNextPut) {
			this.failNextPut = false
			throw new Error("Simulated storage failure")
		}
		this.objects.set(key, { body, contentType })
	}

	async signedUrl(key: string, options: SignedUrlOptions) {
		if (!this.objects.has(key)) throw new Error(`No object ${key}`)
		const params = new URLSearchParams({
			disposition: options.disposition,
			name: options.fileName,
			expiresIn: String(SIGNED_URL_SECONDS),
		})
		return `memory://${key}?${params}`
	}

	async copyToPublic(key: string, publicKey: string) {
		if (!this.objects.has(key)) throw new Error(`No object ${key}`)
		this.published.set(publicKey, key)
	}
}

// ---------- Selection ----------

const globalForStorage = globalThis as unknown as { libraryStorage?: LibraryStorage }

/**
 * S3 when S3_LIBRARY_BUCKET is set. Without it, development uses local disk; production refuses
 * to start serving files rather than silently storing board documents on the container.
 */
export function getLibraryStorage(): LibraryStorage {
	if (globalForStorage.libraryStorage) return globalForStorage.libraryStorage
	const bucket = process.env.S3_LIBRARY_BUCKET
	let storage: LibraryStorage
	if (bucket) {
		storage = new S3LibraryStorage(
			bucket,
			process.env.S3_LIBRARY_REGION ?? process.env.S3_REGION ?? "us-west-2",
		)
	} else if (process.env.NODE_ENV === "production") {
		throw new Error("S3_LIBRARY_BUCKET environment variable is not set")
	} else {
		storage = new LocalLibraryStorage(
			process.env.LIBRARY_LOCAL_DIR ?? path.join(process.cwd(), ".library-storage"),
		)
	}
	globalForStorage.libraryStorage = storage
	return storage
}
