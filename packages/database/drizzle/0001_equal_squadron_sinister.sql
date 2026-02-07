DROP INDEX `invitation_token_idx` ON `invitation`;--> statement-breakpoint
ALTER TABLE `invitation` ADD CONSTRAINT `invitation_token_unique` UNIQUE(`token`);