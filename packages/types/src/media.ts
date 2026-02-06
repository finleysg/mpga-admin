/**
 * Constructs a full S3 media URL from a database path.
 * Example: "photos/logo.png" -> "https://mpgagolf.s3.amazonaws.com/media/photos/logo.png"
 */
export function getMediaUrl(
  path: string | null | undefined,
): string | undefined {
  if (!path) return undefined;

  const bucket = process.env.S3_BUCKET_NAME ?? "mpgagolf";
  const prefix = process.env.S3_MEDIA_PREFIX ?? "media";

  // Already a full URL - return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Normalize path (remove leading slash if present)
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;

  return `https://${bucket}.s3.amazonaws.com/${prefix}/${normalizedPath}`;
}
