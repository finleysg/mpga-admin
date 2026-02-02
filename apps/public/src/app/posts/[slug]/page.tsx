import { db, posts } from "@mpga/database";
import { PostCard } from "@mpga/ui";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!post || !post.published) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <PostCard post={post} />
    </main>
  );
}
