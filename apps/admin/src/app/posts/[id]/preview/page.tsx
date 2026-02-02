import { db, posts } from "@mpga/database";
import { PostCard } from "@mpga/ui";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    notFound();
  }

  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 rounded-md bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          Preview mode - This is how the post will appear on the public site.
        </p>
      </div>
      <PostCard post={post} />
    </main>
  );
}
