CREATE TABLE `announcement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalUrl` varchar(255) NOT NULL,
	`externalName` varchar(40) NOT NULL,
	`title` varchar(100) NOT NULL,
	`text` longtext NOT NULL,
	`createDate` datetime(6) NOT NULL,
	`documentId` int,
	`tournamentInstanceId` int,
	CONSTRAINT `announcement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `award` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` longtext NOT NULL,
	CONSTRAINT `award_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `awardWinner` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`winner` varchar(100) NOT NULL,
	`notes` longtext,
	`awardId` int NOT NULL,
	CONSTRAINT `awardWinner_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `club` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`website` varchar(300) NOT NULL,
	`notes` longtext,
	`golfCourseId` int,
	`size` int,
	`systemName` varchar(50),
	`archived` boolean NOT NULL,
	CONSTRAINT `club_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clubContact` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clubId` int NOT NULL,
	`contactId` int NOT NULL,
	`isPrimary` boolean NOT NULL,
	`notes` varchar(150),
	`userId` int,
	CONSTRAINT `clubContact_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clubContactRole` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` varchar(30) NOT NULL,
	`clubContactId` int NOT NULL,
	CONSTRAINT `clubContactRole_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `committee` (
	`id` int AUTO_INCREMENT NOT NULL,
	`role` varchar(40) NOT NULL,
	`contactId` int NOT NULL,
	`homeClubId` int NOT NULL,
	CONSTRAINT `committee_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(30) NOT NULL,
	`lastName` varchar(30) NOT NULL,
	`primaryPhone` varchar(20),
	`alternatePhone` varchar(20),
	`email` varchar(250),
	`addressText` varchar(200),
	`city` varchar(40),
	`state` varchar(2),
	`zip` varchar(10),
	`notes` longtext,
	`sendEmail` boolean NOT NULL,
	CONSTRAINT `contact_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contentType` varchar(2) NOT NULL,
	`title` varchar(120) NOT NULL,
	`contentText` longtext NOT NULL,
	CONSTRAINT `content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `document` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentType` varchar(20) NOT NULL,
	`year` int,
	`title` varchar(120) NOT NULL,
	`file` varchar(200),
	`lastUpdate` datetime(6) NOT NULL,
	`createdBy` varchar(100) NOT NULL,
	`tournamentId` int,
	CONSTRAINT `document_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentTag` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`tag` varchar(50) NOT NULL,
	CONSTRAINT `documentTag_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `golfCourse` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`addressText` varchar(200) NOT NULL,
	`city` varchar(40) NOT NULL,
	`state` varchar(2) NOT NULL,
	`zip` varchar(10) NOT NULL,
	`websiteUrl` varchar(300) NOT NULL,
	`email` varchar(250) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`notes` longtext,
	`logo` varchar(100) NOT NULL,
	CONSTRAINT `golfCourse_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `matchPlayResult` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupName` varchar(20) NOT NULL,
	`matchDate` date NOT NULL,
	`homeTeamScore` decimal(3,1) NOT NULL,
	`awayTeamScore` decimal(3,1) NOT NULL,
	`enteredBy` varchar(60) NOT NULL,
	`forfeit` boolean NOT NULL,
	`homeTeamId` int NOT NULL,
	`awayTeamId` int NOT NULL,
	`notes` varchar(140),
	CONSTRAINT `matchPlayResult_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `membership` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`paymentDate` date NOT NULL,
	`paymentType` varchar(2) NOT NULL,
	`paymentCode` varchar(100) NOT NULL,
	`createDate` datetime(6) NOT NULL,
	`notes` longtext,
	`clubId` int NOT NULL,
	CONSTRAINT `membership_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageDate` datetime(6) NOT NULL,
	`contactEmail` varchar(254) NOT NULL,
	`contactName` varchar(100) NOT NULL,
	`contactPhone` varchar(20) NOT NULL,
	`course` varchar(100),
	`message` longtext NOT NULL,
	CONSTRAINT `message_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photoType` varchar(20) NOT NULL,
	`year` int NOT NULL,
	`rawImage` varchar(200) NOT NULL,
	`lastUpdate` datetime(6) NOT NULL,
	`caption` varchar(240) NOT NULL,
	`createdBy` varchar(100) NOT NULL,
	`tournamentId` int,
	CONSTRAINT `photo_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `phototag` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photoId` int NOT NULL,
	`tag` varchar(50) NOT NULL,
	CONSTRAINT `phototag_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`groupName` varchar(20) NOT NULL,
	`isSenior` boolean NOT NULL,
	`clubId` int NOT NULL,
	`notes` longtext,
	CONSTRAINT `team_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` longtext NOT NULL,
	`systemName` varchar(20),
	CONSTRAINT `tournament_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournamentHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`location` varchar(100) NOT NULL,
	`winner` varchar(100) NOT NULL,
	`winnerClub` varchar(100) NOT NULL,
	`coWinner` varchar(100) NOT NULL,
	`coWinnerClub` varchar(100) NOT NULL,
	`division` varchar(20) NOT NULL,
	`score` varchar(20) NOT NULL,
	`isMatch` boolean NOT NULL,
	`isNet` boolean NOT NULL,
	`notes` longtext,
	`tournamentId` int NOT NULL,
	CONSTRAINT `tournamentHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournamentInstance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instanceType` varchar(1) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` longtext NOT NULL,
	`notes` longtext,
	`startDate` date NOT NULL,
	`rounds` int NOT NULL,
	`registrationStart` datetime(6),
	`registrationEnd` datetime(6),
	`locationId` int NOT NULL,
	`tournamentId` int,
	CONSTRAINT `tournamentInstance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournamentLink` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkType` varchar(40) NOT NULL,
	`url` varchar(240) NOT NULL,
	`tournamentInstanceId` int NOT NULL,
	`title` varchar(60) NOT NULL,
	CONSTRAINT `tournamentLink_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` varchar(36) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp(3),
	`refresh_token_expires_at` timestamp(3),
	`scope` text,
	`password` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(36) NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(36) NOT NULL,
	`impersonated_by` text,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	`role` text,
	`banned` boolean DEFAULT false,
	`ban_reason` text,
	`ban_expires` timestamp(3),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp(3) NOT NULL,
	`created_at` timestamp(3) NOT NULL DEFAULT (now()),
	`updated_at` timestamp(3) NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`invited_by` varchar(36) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'admin',
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`accepted_at` datetime(3),
	CONSTRAINT `invitation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `announcement` ADD CONSTRAINT `announcement_documentId_document_id_fk` FOREIGN KEY (`documentId`) REFERENCES `document`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `announcement` ADD CONSTRAINT `announcement_tournamentInstanceId_tournamentInstance_id_fk` FOREIGN KEY (`tournamentInstanceId`) REFERENCES `tournamentInstance`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `awardWinner` ADD CONSTRAINT `awardWinner_awardId_award_id_fk` FOREIGN KEY (`awardId`) REFERENCES `award`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `club` ADD CONSTRAINT `club_golfCourseId_golfCourse_id_fk` FOREIGN KEY (`golfCourseId`) REFERENCES `golfCourse`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clubContact` ADD CONSTRAINT `clubContact_clubId_club_id_fk` FOREIGN KEY (`clubId`) REFERENCES `club`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clubContact` ADD CONSTRAINT `clubContact_contactId_contact_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contact`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `clubContactRole` ADD CONSTRAINT `clubContactRole_clubContactId_clubContact_id_fk` FOREIGN KEY (`clubContactId`) REFERENCES `clubContact`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `committee` ADD CONSTRAINT `committee_contactId_contact_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contact`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `committee` ADD CONSTRAINT `committee_homeClubId_club_id_fk` FOREIGN KEY (`homeClubId`) REFERENCES `club`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `document` ADD CONSTRAINT `document_tournamentId_tournament_id_fk` FOREIGN KEY (`tournamentId`) REFERENCES `tournament`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentTag` ADD CONSTRAINT `documentTag_documentId_document_id_fk` FOREIGN KEY (`documentId`) REFERENCES `document`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchPlayResult` ADD CONSTRAINT `matchPlayResult_homeTeamId_team_id_fk` FOREIGN KEY (`homeTeamId`) REFERENCES `team`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `matchPlayResult` ADD CONSTRAINT `matchPlayResult_awayTeamId_team_id_fk` FOREIGN KEY (`awayTeamId`) REFERENCES `team`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `membership` ADD CONSTRAINT `membership_clubId_club_id_fk` FOREIGN KEY (`clubId`) REFERENCES `club`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `photo` ADD CONSTRAINT `photo_tournamentId_tournament_id_fk` FOREIGN KEY (`tournamentId`) REFERENCES `tournament`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `phototag` ADD CONSTRAINT `phototag_photoId_photo_id_fk` FOREIGN KEY (`photoId`) REFERENCES `photo`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team` ADD CONSTRAINT `team_clubId_club_id_fk` FOREIGN KEY (`clubId`) REFERENCES `club`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournamentHistory` ADD CONSTRAINT `tournamentHistory_tournamentId_tournament_id_fk` FOREIGN KEY (`tournamentId`) REFERENCES `tournament`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournamentInstance` ADD CONSTRAINT `tournamentInstance_locationId_golfCourse_id_fk` FOREIGN KEY (`locationId`) REFERENCES `golfCourse`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournamentInstance` ADD CONSTRAINT `tournamentInstance_tournamentId_tournament_id_fk` FOREIGN KEY (`tournamentId`) REFERENCES `tournament`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournamentLink` ADD CONSTRAINT `tournamentLink_tournamentInstanceId_tournamentInstance_id_fk` FOREIGN KEY (`tournamentInstanceId`) REFERENCES `tournamentInstance`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitation` ADD CONSTRAINT `invitation_invited_by_user_id_fk` FOREIGN KEY (`invited_by`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `invitation` (`email`);--> statement-breakpoint
CREATE INDEX `invitation_token_idx` ON `invitation` (`token`);