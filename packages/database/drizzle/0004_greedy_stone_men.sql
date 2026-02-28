CREATE TABLE `role` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(30) NOT NULL,
	CONSTRAINT `role_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clubContactRole` MODIFY COLUMN `role` varchar(30);--> statement-breakpoint
ALTER TABLE `clubContactRole` ADD `roleId` int;--> statement-breakpoint
ALTER TABLE `clubContactRole` ADD CONSTRAINT `clubContactRole_roleId_role_id_fk` FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE no action ON UPDATE no action;