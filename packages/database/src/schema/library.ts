import {
	boolean,
	datetime,
	index,
	int,
	json,
	mediumtext,
	mysqlTable,
	primaryKey,
	uniqueIndex,
	varchar,
} from "drizzle-orm/mysql-core"

// Board document library.
//
// User ids (better-auth `user.id`) are stored without foreign keys on purpose: version history
// and the audit trail must survive a user being removed. Links to the legacy `document` table
// live in `library_publication` so this schema is purely additive (CREATE TABLE only), which
// keeps the startup migration safe to re-run.

export const libraryFolder = mysqlTable(
	"library_folder",
	{
		id: int("id").autoincrement().primaryKey(),
		parentId: int("parent_id"),
		name: varchar("name", { length: 120 }).notNull(),
		depth: int("depth").notNull(),
		isRestricted: boolean("is_restricted").notNull().default(false),
		createdBy: varchar("created_by", { length: 36 }).notNull(),
		createdAt: datetime("created_at", { fsp: 3 }).notNull(),
		deletedAt: datetime("deleted_at", { fsp: 3 }),
		deletedBy: varchar("deleted_by", { length: 36 }),
		deletedBatchId: varchar("deleted_batch_id", { length: 36 }),
	},
	(table) => [
		index("library_folder_parent_idx").on(table.parentId),
		index("library_folder_batch_idx").on(table.deletedBatchId),
	],
)

export const libraryFolderMember = mysqlTable(
	"library_folder_member",
	{
		folderId: int("folder_id")
			.notNull()
			.references(() => libraryFolder.id, { onDelete: "cascade" }),
		userId: varchar("user_id", { length: 36 }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.folderId, table.userId] })],
)

export const libraryFile = mysqlTable(
	"library_file",
	{
		id: int("id").autoincrement().primaryKey(),
		folderId: int("folder_id")
			.notNull()
			.references(() => libraryFolder.id),
		name: varchar("name", { length: 200 }).notNull(),
		currentVersionId: int("current_version_id"),
		createdBy: varchar("created_by", { length: 36 }).notNull(),
		createdAt: datetime("created_at", { fsp: 3 }).notNull(),
		updatedBy: varchar("updated_by", { length: 36 }).notNull(),
		updatedAt: datetime("updated_at", { fsp: 3 }).notNull(),
		deletedAt: datetime("deleted_at", { fsp: 3 }),
		deletedBy: varchar("deleted_by", { length: 36 }),
		deletedBatchId: varchar("deleted_batch_id", { length: 36 }),
	},
	(table) => [
		index("library_file_folder_name_idx").on(table.folderId, table.name),
		index("library_file_batch_idx").on(table.deletedBatchId),
	],
)

export const libraryFileVersion = mysqlTable(
	"library_file_version",
	{
		id: int("id").autoincrement().primaryKey(),
		fileId: int("file_id")
			.notNull()
			.references(() => libraryFile.id),
		versionNo: int("version_no").notNull(),
		s3Key: varchar("s3_key", { length: 255 }).notNull(),
		size: int("size").notNull(),
		contentType: varchar("content_type", { length: 120 }).notNull(),
		originalName: varchar("original_name", { length: 255 }).notNull(),
		uploadedBy: varchar("uploaded_by", { length: 36 }).notNull(),
		uploadedAt: datetime("uploaded_at", { fsp: 3 }).notNull(),
		restoredFromVersionId: int("restored_from_version_id"),
	},
	(table) => [uniqueIndex("library_file_version_no_idx").on(table.fileId, table.versionNo)],
)

export const libraryFileText = mysqlTable("library_file_text", {
	versionId: int("version_id")
		.primaryKey()
		.references(() => libraryFileVersion.id, { onDelete: "cascade" }),
	body: mediumtext("body").notNull(),
})

export const libraryPublication = mysqlTable(
	"library_publication",
	{
		documentId: int("document_id").primaryKey(),
		versionId: int("version_id")
			.notNull()
			.references(() => libraryFileVersion.id),
		publishedBy: varchar("published_by", { length: 36 }).notNull(),
		publishedAt: datetime("published_at", { fsp: 3 }).notNull(),
	},
	(table) => [index("library_publication_version_idx").on(table.versionId)],
)

export const libraryAudit = mysqlTable(
	"library_audit",
	{
		id: int("id").autoincrement().primaryKey(),
		actorUserId: varchar("actor_user_id", { length: 36 }).notNull(),
		action: varchar("action", { length: 30 }).notNull(),
		entityType: varchar("entity_type", { length: 20 }).notNull(),
		entityId: int("entity_id").notNull(),
		details: json("details"),
		createdAt: datetime("created_at", { fsp: 3 }).notNull(),
	},
	(table) => [index("library_audit_entity_idx").on(table.entityType, table.entityId)],
)
