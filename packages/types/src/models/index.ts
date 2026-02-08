import type {
	announcement,
	award,
	awardWinner,
	club,
	clubContact,
	clubContactRole,
	committee,
	contact,
	content,
	document,
	documentTag,
	golfCourse,
	matchPlayResult,
	membership,
	message,
	photo,
	phototag,
	team,
	tournament,
	tournamentHistory,
	tournamentInstance,
	tournamentLink,
} from "@mpga/database"
import type { InferInsertModel, InferSelectModel } from "drizzle-orm"

// Announcement types
export type Announcement = InferSelectModel<typeof announcement>
export type NewAnnouncement = InferInsertModel<typeof announcement>

// Award types
export type Award = InferSelectModel<typeof award>
export type NewAward = InferInsertModel<typeof award>

export type AwardWinner = InferSelectModel<typeof awardWinner>
export type NewAwardWinner = InferInsertModel<typeof awardWinner>

// Club types
export type Club = InferSelectModel<typeof club>
export type NewClub = InferInsertModel<typeof club>

export type ClubContact = InferSelectModel<typeof clubContact>
export type NewClubContact = InferInsertModel<typeof clubContact>

export type ClubContactRole = InferSelectModel<typeof clubContactRole>
export type NewClubContactRole = InferInsertModel<typeof clubContactRole>

// Committee types
export type Committee = InferSelectModel<typeof committee>
export type NewCommittee = InferInsertModel<typeof committee>

// Contact types
export type Contact = InferSelectModel<typeof contact>
export type NewContact = InferInsertModel<typeof contact>

// Content types
export type Content = InferSelectModel<typeof content>
export type NewContent = InferInsertModel<typeof content>

// Document types
export type Document = InferSelectModel<typeof document>
export type NewDocument = InferInsertModel<typeof document>

export type DocumentTag = InferSelectModel<typeof documentTag>
export type NewDocumentTag = InferInsertModel<typeof documentTag>

// Golf Course types
export type GolfCourse = InferSelectModel<typeof golfCourse>
export type NewGolfCourse = InferInsertModel<typeof golfCourse>

// Match Play types
export type MatchPlayResult = InferSelectModel<typeof matchPlayResult>
export type NewMatchPlayResult = InferInsertModel<typeof matchPlayResult>

// Membership types
export type Membership = InferSelectModel<typeof membership>
export type NewMembership = InferInsertModel<typeof membership>

// Message types
export type Message = InferSelectModel<typeof message>
export type NewMessage = InferInsertModel<typeof message>

// Photo types
export type Photo = InferSelectModel<typeof photo>
export type NewPhoto = InferInsertModel<typeof photo>

export type PhotoTag = InferSelectModel<typeof phototag>
export type NewPhotoTag = InferInsertModel<typeof phototag>

// Team types
export type Team = InferSelectModel<typeof team>
export type NewTeam = InferInsertModel<typeof team>

// Tournament types
export type Tournament = InferSelectModel<typeof tournament>
export type NewTournament = InferInsertModel<typeof tournament>

export type TournamentHistory = InferSelectModel<typeof tournamentHistory>
export type NewTournamentHistory = InferInsertModel<typeof tournamentHistory>

export type TournamentInstance = InferSelectModel<typeof tournamentInstance>
export type NewTournamentInstance = InferInsertModel<typeof tournamentInstance>

export type TournamentLink = InferSelectModel<typeof tournamentLink>
export type NewTournamentLink = InferInsertModel<typeof tournamentLink>
