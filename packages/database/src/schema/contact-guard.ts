import { datetime, index, int, mysqlTable, varchar } from "drizzle-orm/mysql-core"

// Shared across app instances; expired rows are pruned by the contact endpoint.
export const contactGuard = mysqlTable(
	"contactGuard",
	{
		key: varchar({ length: 80 }).primaryKey(),
		count: int().notNull(),
		expiresAt: datetime({ mode: "date", fsp: 3 }).notNull(),
	},
	(table) => [index("contactGuard_expiry").on(table.expiresAt)],
)
