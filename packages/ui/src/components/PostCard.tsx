import type { Post } from "@mpga/types";

export interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">{post.title}</h2>
      {post.excerpt && (
        <p className="mt-2 text-gray-600">{post.excerpt}</p>
      )}
      {post.content && (
        <div
          className="prose mt-4"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      )}
      <div className="mt-4 text-sm text-gray-500">
        {post.createdAt instanceof Date
          ? post.createdAt.toLocaleDateString()
          : new Date(post.createdAt).toLocaleDateString()}
      </div>
    </article>
  );
}
