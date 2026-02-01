import {
  boolean,
  datetime,
  int,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

export const posts = mysqlTable("posts", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  published: boolean("published").default(false).notNull(),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});
