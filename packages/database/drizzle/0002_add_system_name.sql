ALTER TABLE `award` ADD `systemName` varchar(20);--> statement-breakpoint
ALTER TABLE `content` RENAME COLUMN `contentType` TO `systemName`;--> statement-breakpoint
ALTER TABLE `content` MODIFY COLUMN `systemName` varchar(20) NOT NULL;
