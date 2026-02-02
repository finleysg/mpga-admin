import type { posts } from "@mpga/database";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export type Post = InferSelectModel<typeof posts>;
export type NewPost = InferInsertModel<typeof posts>;

export type PostPreview = Pick<
  Post,
  "id" | "title" | "slug" | "excerpt" | "createdAt"
>;
