import Link from "next/link";

import { db, posts } from "@mpga/database";

export default async function AdminDashboard() {
  const allPosts = await db.select().from(posts).orderBy(posts.createdAt);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <Link
          href="/posts/new"
          className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700"
        >
          New Post
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Posts</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {allPosts.map((post) => (
            <li key={post.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/posts/${post.id}`}
                    className="font-medium text-gray-900 hover:text-primary-600"
                  >
                    {post.title}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {post.published ? "Published" : "Draft"}
                  </p>
                </div>
                <Link
                  href={`/posts/${post.id}/preview`}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Preview
                </Link>
              </div>
            </li>
          ))}
          {allPosts.length === 0 && (
            <li className="px-6 py-8 text-center text-gray-500">
              No posts yet. Create your first post.
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}
