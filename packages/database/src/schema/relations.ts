import { relations } from "drizzle-orm/relations"

import { user, session, account } from "./auth"
import {
	document,
	announcement,
	tournamentInstance,
	award,
	awardWinner,
	golfCourse,
	club,
	clubContact,
	contact,
	clubContactRole,
	committee,
	tournament,
	documentTag,
	team,
	matchPlayResult,
	membership,
	photo,
	phototag,
	tournamentHistory,
	tournamentLink,
} from "./schema"

export const announcementRelations = relations(announcement, ({ one }) => ({
	document: one(document, {
		fields: [announcement.documentId],
		references: [document.id],
	}),
	tournamentInstance: one(tournamentInstance, {
		fields: [announcement.tournamentInstanceId],
		references: [tournamentInstance.id],
	}),
}))

export const documentRelations = relations(document, ({ one, many }) => ({
	announcements: many(announcement),
	tournament: one(tournament, {
		fields: [document.tournamentId],
		references: [tournament.id],
	}),
	documentTags: many(documentTag),
}))

export const tournamentInstanceRelations = relations(tournamentInstance, ({ one, many }) => ({
	announcements: many(announcement),
	golfCourse: one(golfCourse, {
		fields: [tournamentInstance.locationId],
		references: [golfCourse.id],
	}),
	tournament: one(tournament, {
		fields: [tournamentInstance.tournamentId],
		references: [tournament.id],
	}),
	tournamentLinks: many(tournamentLink),
}))

export const awardWinnerRelations = relations(awardWinner, ({ one }) => ({
	award: one(award, {
		fields: [awardWinner.awardId],
		references: [award.id],
	}),
}))

export const awardRelations = relations(award, ({ many }) => ({
	awardWinners: many(awardWinner),
}))

export const clubRelations = relations(club, ({ one, many }) => ({
	golfCourse: one(golfCourse, {
		fields: [club.golfCourseId],
		references: [golfCourse.id],
	}),
	clubContacts: many(clubContact),
	committees: many(committee),
	memberships: many(membership),
	teams: many(team),
}))

export const golfCourseRelations = relations(golfCourse, ({ many }) => ({
	clubs: many(club),
	tournamentInstances: many(tournamentInstance),
}))

export const clubContactRelations = relations(clubContact, ({ one, many }) => ({
	club: one(club, {
		fields: [clubContact.clubId],
		references: [club.id],
	}),
	contact: one(contact, {
		fields: [clubContact.contactId],
		references: [contact.id],
	}),
	clubContactRoles: many(clubContactRole),
}))

export const contactRelations = relations(contact, ({ many }) => ({
	clubContacts: many(clubContact),
	committees: many(committee),
}))

export const clubContactRoleRelations = relations(clubContactRole, ({ one }) => ({
	clubContact: one(clubContact, {
		fields: [clubContactRole.clubContactId],
		references: [clubContact.id],
	}),
}))

export const committeeRelations = relations(committee, ({ one }) => ({
	club: one(club, {
		fields: [committee.homeClubId],
		references: [club.id],
	}),
	contact: one(contact, {
		fields: [committee.contactId],
		references: [contact.id],
	}),
}))

export const tournamentRelations = relations(tournament, ({ many }) => ({
	documents: many(document),
	photos: many(photo),
	tournamentHistories: many(tournamentHistory),
	tournamentInstances: many(tournamentInstance),
}))

export const documentTagRelations = relations(documentTag, ({ one }) => ({
	document: one(document, {
		fields: [documentTag.documentId],
		references: [document.id],
	}),
}))

export const matchPlayResultRelations = relations(matchPlayResult, ({ one }) => ({
	team_awayTeamId: one(team, {
		fields: [matchPlayResult.awayTeamId],
		references: [team.id],
		relationName: "matchPlayResult_awayTeamId_team_id",
	}),
	team_homeTeamId: one(team, {
		fields: [matchPlayResult.homeTeamId],
		references: [team.id],
		relationName: "matchPlayResult_homeTeamId_team_id",
	}),
}))

export const teamRelations = relations(team, ({ one, many }) => ({
	matchPlayResults_awayTeamId: many(matchPlayResult, {
		relationName: "matchPlayResult_awayTeamId_team_id",
	}),
	matchPlayResults_homeTeamId: many(matchPlayResult, {
		relationName: "matchPlayResult_homeTeamId_team_id",
	}),
	club: one(club, {
		fields: [team.clubId],
		references: [club.id],
	}),
}))

export const membershipRelations = relations(membership, ({ one }) => ({
	club: one(club, {
		fields: [membership.clubId],
		references: [club.id],
	}),
}))

export const photoRelations = relations(photo, ({ one, many }) => ({
	tournament: one(tournament, {
		fields: [photo.tournamentId],
		references: [tournament.id],
	}),
	phototags: many(phototag),
}))

export const phototagRelations = relations(phototag, ({ one }) => ({
	photo: one(photo, {
		fields: [phototag.photoId],
		references: [photo.id],
	}),
}))

export const tournamentHistoryRelations = relations(tournamentHistory, ({ one }) => ({
	tournament: one(tournament, {
		fields: [tournamentHistory.tournamentId],
		references: [tournament.id],
	}),
}))

export const tournamentLinkRelations = relations(tournamentLink, ({ one }) => ({
	tournamentInstance: one(tournamentInstance, {
		fields: [tournamentLink.tournamentInstanceId],
		references: [tournamentInstance.id],
	}),
}))

// Better Auth relations
export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}))

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}))
