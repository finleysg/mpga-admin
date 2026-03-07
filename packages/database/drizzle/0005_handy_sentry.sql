CREATE TABLE `matchPlayGroup` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`groupName` varchar(20) NOT NULL,
	CONSTRAINT `matchPlayGroup_id` PRIMARY KEY(`id`),
	CONSTRAINT `matchPlayGroup_year_groupName` UNIQUE(`year`,`groupName`)
);
--> statement-breakpoint
CREATE TABLE `teamCaptain` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`contactId` int NOT NULL,
	CONSTRAINT `teamCaptain_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `teamCaptain` ADD CONSTRAINT `teamCaptain_teamId_team_id_fk` FOREIGN KEY (`teamId`) REFERENCES `team`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamCaptain` ADD CONSTRAINT `teamCaptain_contactId_contact_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contact`(`id`) ON DELETE no action ON UPDATE no action;