import {
	mysqlTable,
	primaryKey,
	int,
	varchar,
	longtext,
	datetime,
	date,
	decimal,
	boolean,
} from "drizzle-orm/mysql-core"

export const announcement = mysqlTable(
	"announcement",
	{
		id: int().autoincrement().notNull(),
		externalUrl: varchar({ length: 255 }).notNull(),
		externalName: varchar({ length: 40 }).notNull(),
		title: varchar({ length: 100 }).notNull(),
		text: longtext().notNull(),
		createDate: datetime({ mode: "string", fsp: 6 }).notNull(),
		documentId: int().references(() => document.id),
		tournamentInstanceId: int().references(() => tournamentInstance.id),
	},
	(table) => [primaryKey({ columns: [table.id], name: "announcement_id" })],
)

export const award = mysqlTable(
	"award",
	{
		id: int().autoincrement().notNull(),
		name: varchar({ length: 100 }).notNull(),
		description: longtext().notNull(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "award_id" })],
)

export const awardWinner = mysqlTable(
	"awardWinner",
	{
		id: int().autoincrement().notNull(),
		year: int().notNull(),
		winner: varchar({ length: 100 }).notNull(),
		notes: longtext(),
		awardId: int()
			.notNull()
			.references(() => award.id),
	},
	(table) => [primaryKey({ columns: [table.id], name: "awardWinner_id" })],
)

export const club = mysqlTable(
	"club",
	{
		id: int().autoincrement().notNull(),
		name: varchar({ length: 200 }).notNull(),
		website: varchar({ length: 300 }).notNull(),
		notes: longtext(),
		golfCourseId: int().references(() => golfCourse.id),
		size: int(),
		systemName: varchar({ length: 50 }),
		archived: boolean().notNull(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "club_id" })],
)

export const clubContact = mysqlTable(
	"clubContact",
	{
		id: int().autoincrement().notNull(),
		clubId: int()
			.notNull()
			.references(() => club.id),
		contactId: int()
			.notNull()
			.references(() => contact.id),
		isPrimary: boolean().notNull(),
		notes: varchar({ length: 150 }),
		userId: int(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "clubContact_id" })],
)

export const clubContactRole = mysqlTable(
	"clubContactRole",
	{
		id: int().autoincrement().notNull(),
		role: varchar({ length: 30 }).notNull(),
		clubContactId: int()
			.notNull()
			.references(() => clubContact.id),
	},
	(table) => [primaryKey({ columns: [table.id], name: "clubContactRole_id" })],
)

export const committee = mysqlTable(
	"committee",
	{
		id: int().autoincrement().notNull(),
		role: varchar({ length: 40 }).notNull(),
		contactId: int()
			.notNull()
			.references(() => contact.id),
		homeClubId: int()
			.notNull()
			.references(() => club.id),
	},
	(table) => [primaryKey({ columns: [table.id], name: "committee_id" })],
)

export const contact = mysqlTable(
	"contact",
	{
		id: int().autoincrement().notNull(),
		firstName: varchar({ length: 30 }).notNull(),
		lastName: varchar({ length: 30 }).notNull(),
		primaryPhone: varchar({ length: 20 }),
		alternatePhone: varchar({ length: 20 }),
		email: varchar({ length: 250 }),
		addressText: varchar({ length: 200 }),
		city: varchar({ length: 40 }),
		state: varchar({ length: 2 }),
		zip: varchar({ length: 10 }),
		notes: longtext(),
		sendEmail: boolean().notNull(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "contact_id" })],
)

export const content = mysqlTable(
	"content",
	{
		id: int().autoincrement().notNull(),
		contentType: varchar({ length: 2 }).notNull(),
		title: varchar({ length: 120 }).notNull(),
		contentText: longtext().notNull(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "content_id" })],
)

export const document = mysqlTable(
	"document",
	{
		id: int().autoincrement().notNull(),
		documentType: varchar({ length: 20 }).notNull(),
		year: int(),
		title: varchar({ length: 120 }).notNull(),
		file: varchar({ length: 200 }),
		lastUpdate: datetime({ mode: "string", fsp: 6 }).notNull(),
		createdBy: varchar({ length: 100 }).notNull(),
		tournamentId: int().references(() => tournament.id),
	},
	(table) => [primaryKey({ columns: [table.id], name: "document_id" })],
)

export const documentTag = mysqlTable(
	"documentTag",
	{
		id: int().autoincrement().notNull(),
		documentId: int()
			.notNull()
			.references(() => document.id),
		tag: varchar({ length: 50 }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "documentTag_id" })],
)

export const golfCourse = mysqlTable(
	"golfCourse",
	{
		id: int().autoincrement().notNull(),
		name: varchar({ length: 200 }).notNull(),
		addressText: varchar({ length: 200 }).notNull(),
		city: varchar({ length: 40 }).notNull(),
		state: varchar({ length: 2 }).notNull(),
		zip: varchar({ length: 10 }).notNull(),
		websiteUrl: varchar({ length: 300 }).notNull(),
		email: varchar({ length: 250 }).notNull(),
		phone: varchar({ length: 20 }).notNull(),
		notes: longtext(),
		logo: varchar({ length: 100 }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "golfCourse_id" })],
)

export const matchPlayResult = mysqlTable(
	"matchPlayResult",
	{
		id: int().autoincrement().notNull(),
		groupName: varchar({ length: 20 }).notNull(),
		// you can use { mode: 'date' }, if you want to have Date as type for this column
		matchDate: date({ mode: "string" }).notNull(),
		homeTeamScore: decimal({ precision: 3, scale: 1 }).notNull(),
		awayTeamScore: decimal({ precision: 3, scale: 1 }).notNull(),
		enteredBy: varchar({ length: 60 }).notNull(),
		forfeit: boolean().notNull(),
		homeTeamId: int()
			.notNull()
			.references(() => team.id),
		awayTeamId: int()
			.notNull()
			.references(() => team.id),
		notes: varchar({ length: 140 }),
	},
	(table) => [primaryKey({ columns: [table.id], name: "matchPlayResult_id" })],
)

export const membership = mysqlTable(
	"membership",
	{
		id: int().autoincrement().notNull(),
		year: int().notNull(),
		// you can use { mode: 'date' }, if you want to have Date as type for this column
		paymentDate: date({ mode: "string" }).notNull(),
		paymentType: varchar({ length: 2 }).notNull(),
		paymentCode: varchar({ length: 100 }).notNull(),
		createDate: datetime({ mode: "string", fsp: 6 }).notNull(),
		notes: longtext(),
		clubId: int()
			.notNull()
			.references(() => club.id),
	},
	(table) => [primaryKey({ columns: [table.id], name: "membership_id" })],
)

export const message = mysqlTable(
	"message",
	{
		id: int().autoincrement().notNull(),
		messageDate: datetime({ mode: "string", fsp: 6 }).notNull(),
		contactEmail: varchar({ length: 254 }).notNull(),
		contactName: varchar({ length: 100 }).notNull(),
		contactPhone: varchar({ length: 20 }).notNull(),
		course: varchar({ length: 100 }),
		message: longtext().notNull(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "message_id" })],
)

export const photo = mysqlTable(
	"photo",
	{
		id: int().autoincrement().notNull(),
		photoType: varchar({ length: 20 }).notNull(),
		year: int().notNull(),
		rawImage: varchar({ length: 200 }).notNull(),
		lastUpdate: datetime({ mode: "string", fsp: 6 }).notNull(),
		caption: varchar({ length: 240 }).notNull(),
		createdBy: varchar({ length: 100 }).notNull(),
		tournamentId: int().references(() => tournament.id),
	},
	(table) => [primaryKey({ columns: [table.id], name: "photo_id" })],
)

export const phototag = mysqlTable(
	"phototag",
	{
		id: int().autoincrement().notNull(),
		photoId: int()
			.notNull()
			.references(() => photo.id),
		tag: varchar({ length: 50 }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "phototag_id" })],
)

export const team = mysqlTable(
	"team",
	{
		id: int().autoincrement().notNull(),
		year: int().notNull(),
		groupName: varchar({ length: 20 }).notNull(),
		isSenior: boolean().notNull(),
		clubId: int()
			.notNull()
			.references(() => club.id),
		notes: longtext(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "team_id" })],
)

export const tournament = mysqlTable(
	"tournament",
	{
		id: int().autoincrement().notNull(),
		name: varchar({ length: 100 }).notNull(),
		description: longtext().notNull(),
		systemName: varchar({ length: 20 }),
	},
	(table) => [primaryKey({ columns: [table.id], name: "tournament_id" })],
)

export const tournamentHistory = mysqlTable(
	"tournamentHistory",
	{
		id: int().autoincrement().notNull(),
		year: int().notNull(),
		location: varchar({ length: 100 }).notNull(),
		winner: varchar({ length: 100 }).notNull(),
		winnerClub: varchar({ length: 100 }).notNull(),
		coWinner: varchar({ length: 100 }).notNull(),
		coWinnerClub: varchar({ length: 100 }).notNull(),
		division: varchar({ length: 20 }).notNull(),
		score: varchar({ length: 20 }).notNull(),
		isMatch: boolean().notNull(),
		isNet: boolean().notNull(),
		notes: longtext(),
		tournamentId: int()
			.notNull()
			.references(() => tournament.id),
	},
	(table) => [primaryKey({ columns: [table.id], name: "tournamentHistory_id" })],
)

export const tournamentInstance = mysqlTable(
	"tournamentInstance",
	{
		id: int().autoincrement().notNull(),
		instanceType: varchar({ length: 1 }).notNull(),
		name: varchar({ length: 100 }).notNull(),
		description: longtext().notNull(),
		notes: longtext(),
		// you can use { mode: 'date' }, if you want to have Date as type for this column
		startDate: date({ mode: "string" }).notNull(),
		rounds: int().notNull(),
		registrationStart: datetime({ mode: "string", fsp: 6 }),
		registrationEnd: datetime({ mode: "string", fsp: 6 }),
		locationId: int()
			.notNull()
			.references(() => golfCourse.id),
		tournamentId: int().references(() => tournament.id),
	},
	(table) => [primaryKey({ columns: [table.id], name: "tournamentInstance_id" })],
)

export const tournamentLink = mysqlTable(
	"tournamentLink",
	{
		id: int().autoincrement().notNull(),
		linkType: varchar({ length: 40 }).notNull(),
		url: varchar({ length: 240 }).notNull(),
		tournamentInstanceId: int()
			.notNull()
			.references(() => tournamentInstance.id),
		title: varchar({ length: 60 }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.id], name: "tournamentLink_id" })],
)
