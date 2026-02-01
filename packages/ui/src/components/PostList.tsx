import type { PostPreview } from "@mpga/types";

export interface PostListProps {
  posts: PostPreview[];
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No posts found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.id}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <h3 className="text-lg font-medium text-gray-900">
            <a href={`/posts/${post.slug}`} className="hover:text-primary-600">
              {post.title}
            </a>
          </h3>
          {post.excerpt && (
            <p className="mt-1 text-sm text-gray-600">{post.excerpt}</p>
          )}
          <div className="mt-2 text-xs text-gray-500">
            {post.createdAt instanceof Date
              ? post.createdAt.toLocaleDateString()
              : new Date(post.createdAt).toLocaleDateString()}
          </div>
        </article>
      ))}
    </div>
  );
}
