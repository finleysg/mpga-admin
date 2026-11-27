CREATE TABLE IF NOT EXISTS `library_folder` (
	`id` int AUTO_INCREMENT NOT NULL,
	`parent_id` int,
	`name` varchar(120) NOT NULL,
	`depth` int NOT NULL,
	`is_restricted` boolean NOT NULL DEFAULT false,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`deleted_at` datetime(3),
	`deleted_by` varchar(36),
	`deleted_batch_id` varchar(36),
	`live_parent_key` int GENERATED ALWAYS AS ((if(`deleted_at` is null, coalesce(`parent_id`, 0), null))) STORED,
	CONSTRAINT `library_folder_id` PRIMARY KEY(`id`),
	CONSTRAINT `library_folder_live_name_idx` UNIQUE(`live_parent_key`,`name`),
	INDEX `library_folder_parent_idx` (`parent_id`),
	INDEX `library_folder_batch_idx` (`deleted_batch_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `library_folder_member` (
	`folder_id` int NOT NULL,
	`user_id` varchar(36) NOT NULL,
	CONSTRAINT `library_folder_member_folder_id_user_id_pk` PRIMARY KEY(`folder_id`,`user_id`),
	CONSTRAINT `library_folder_member_folder_id_library_folder_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `library_folder`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `library_file` (
	`id` int AUTO_INCREMENT NOT NULL,
	`folder_id` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`current_version_id` int,
	`created_by` varchar(36) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_by` varchar(36) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	`deleted_at` datetime(3),
	`deleted_by` varchar(36),
	`deleted_batch_id` varchar(36),
	`live_folder_key` int GENERATED ALWAYS AS ((if(`deleted_at` is null, `folder_id`, null))) STORED,
	CONSTRAINT `library_file_id` PRIMARY KEY(`id`),
	CONSTRAINT `library_file_live_name_idx` UNIQUE(`live_folder_key`,`name`),
	CONSTRAINT `library_file_folder_id_library_folder_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `library_folder`(`id`) ON DELETE no action ON UPDATE no action,
	INDEX `library_file_folder_name_idx` (`folder_id`,`name`),
	INDEX `library_file_batch_idx` (`deleted_batch_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `library_file_version` (
	`id` int AUTO_INCREMENT NOT NULL,
	`file_id` int NOT NULL,
	`version_no` int NOT NULL,
	`s3_key` varchar(255) NOT NULL,
	`size` int NOT NULL,
	`content_type` varchar(120) NOT NULL,
	`original_name` varchar(255) NOT NULL,
	`uploaded_by` varchar(36) NOT NULL,
	`uploaded_at` datetime(3) NOT NULL,
	`restored_from_version_id` int,
	`content_version_id` int,
	CONSTRAINT `library_file_version_id` PRIMARY KEY(`id`),
	CONSTRAINT `library_file_version_no_idx` UNIQUE(`file_id`,`version_no`),
	CONSTRAINT `library_file_version_file_id_library_file_id_fk` FOREIGN KEY (`file_id`) REFERENCES `library_file`(`id`) ON DELETE no action ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `library_file_text` (
	`version_id` int NOT NULL,
	`body` mediumtext NOT NULL,
	CONSTRAINT `library_file_text_version_id` PRIMARY KEY(`version_id`),
	CONSTRAINT `library_file_text_version_id_library_file_version_id_fk` FOREIGN KEY (`version_id`) REFERENCES `library_file_version`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `library_publication` (
	`document_id` int NOT NULL,
	`version_id` int NOT NULL,
	`published_by` varchar(36) NOT NULL,
	`published_at` datetime(3) NOT NULL,
	CONSTRAINT `library_publication_document_id` PRIMARY KEY(`document_id`),
	CONSTRAINT `library_publication_version_id_library_file_version_id_fk` FOREIGN KEY (`version_id`) REFERENCES `library_file_version`(`id`) ON DELETE no action ON UPDATE no action,
	INDEX `library_publication_version_idx` (`version_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `library_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actor_user_id` varchar(36) NOT NULL,
	`action` varchar(30) NOT NULL,
	`entity_type` varchar(20) NOT NULL,
	`entity_id` int NOT NULL,
	`details` json,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `library_audit_id` PRIMARY KEY(`id`),
	INDEX `library_audit_entity_idx` (`entity_type`,`entity_id`)
);
