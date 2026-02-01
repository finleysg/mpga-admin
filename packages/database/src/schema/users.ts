import { datetime, int, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  emailVerified: datetime("email_verified"),
  image: text("image"),
  createdAt: datetime("created_at").notNull(),
  updatedAt: datetime("updated_at").notNull(),
});

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: int("user_id").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at").notNull(),
});

export const accounts = mysqlTable("accounts", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: datetime("expires_at"),
  createdAt: datetime("created_at").notNull(),
});
