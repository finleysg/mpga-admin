import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getMediaUrl } from "../media"

describe("getMediaUrl", () => {
	const KEYS = [
		"S3_BUCKET_NAME",
		"S3_MEDIA_PREFIX",
		"NEXT_PUBLIC_S3_BUCKET_NAME",
		"NEXT_PUBLIC_S3_MEDIA_PREFIX",
	] as const
	const originalEnv = { ...process.env }

	beforeEach(() => {
		for (const key of KEYS) delete process.env[key]
	})

	afterEach(() => {
		for (const key of KEYS) {
			if (originalEnv[key] !== undefined) process.env[key] = originalEnv[key]
			else delete process.env[key]
		}
	})

	it("returns undefined for null", () => {
		expect(getMediaUrl(null)).toBeUndefined()
	})

	it("returns undefined for undefined", () => {
		expect(getMediaUrl(undefined)).toBeUndefined()
	})

	it("returns undefined for empty string", () => {
		expect(getMediaUrl("")).toBeUndefined()
	})

	it("returns https URL as-is", () => {
		expect(getMediaUrl("https://example.com/photo.jpg")).toBe("https://example.com/photo.jpg")
	})

	it("returns http URL as-is", () => {
		expect(getMediaUrl("http://example.com/photo.jpg")).toBe("http://example.com/photo.jpg")
	})

	it("strips leading slash and constructs S3 URL", () => {
		expect(getMediaUrl("/photos/logo.png")).toBe(
			"https://mpgagolf.s3.amazonaws.com/media/photos/logo.png",
		)
	})

	it("constructs S3 URL for relative path", () => {
		expect(getMediaUrl("photos/logo.png")).toBe(
			"https://mpgagolf.s3.amazonaws.com/media/photos/logo.png",
		)
	})

	it("uses default bucket and prefix", () => {
		const url = getMediaUrl("test.jpg")
		expect(url).toBe("https://mpgagolf.s3.amazonaws.com/media/test.jpg")
	})

	it("respects S3_BUCKET_NAME environment variable", () => {
		process.env.S3_BUCKET_NAME = "custom-bucket"
		expect(getMediaUrl("test.jpg")).toBe("https://custom-bucket.s3.amazonaws.com/media/test.jpg")
	})

	it("respects S3_MEDIA_PREFIX environment variable", () => {
		process.env.S3_MEDIA_PREFIX = "assets"
		expect(getMediaUrl("test.jpg")).toBe("https://mpgagolf.s3.amazonaws.com/assets/test.jpg")
	})

	it("respects both environment variable overrides", () => {
		process.env.S3_BUCKET_NAME = "my-bucket"
		process.env.S3_MEDIA_PREFIX = "files"
		expect(getMediaUrl("test.jpg")).toBe("https://my-bucket.s3.amazonaws.com/files/test.jpg")
	})

	it("prefers the NEXT_PUBLIC_ settings, which client components can read", () => {
		process.env.S3_BUCKET_NAME = "server-bucket"
		process.env.NEXT_PUBLIC_S3_BUCKET_NAME = "mpgagolf-test"
		process.env.NEXT_PUBLIC_S3_MEDIA_PREFIX = "media"
		expect(getMediaUrl("documents/a.pdf")).toBe(
			"https://mpgagolf-test.s3.amazonaws.com/media/documents/a.pdf",
		)
	})
})
