import { db, posts } from "@mpga/database";
import { PostList } from "@mpga/ui";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const publishedPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(eq(posts.published, true))
    .orderBy(posts.createdAt);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-gray-900">MPGA</h1>
      <PostList posts={publishedPosts} />
    </main>
  );
}
