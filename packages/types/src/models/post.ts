import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

import type { posts } from "@mpga/database";

export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;

export type PostPreview = Pick<Post, "id" | "title" | "slug" | "excerpt" | "createdAt">;
