import { mysqlTable, varchar, datetime, index } from "drizzle-orm/mysql-core"

import { user } from "./auth"

export const invitation = mysqlTable(
	"invitation",
	{
		id: varchar("id", { length: 36 }).primaryKey(),
		email: varchar("email", { length: 255 }).notNull(),
		token: varchar("token", { length: 255 }).notNull().unique(),
		invitedBy: varchar("invited_by", { length: 36 })
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: varchar("role", { length: 50 }).notNull().default("admin"),
		status: varchar("status", { length: 20 }).notNull().default("pending"),
		expiresAt: datetime("expires_at", { fsp: 3 }).notNull(),
		createdAt: datetime("created_at", { fsp: 3 }).notNull(),
		acceptedAt: datetime("accepted_at", { fsp: 3 }),
	},
	(table) => [index("invitation_email_idx").on(table.email)],
)
