CREATE TABLE `contactGuard` (
	`key` varchar(80) NOT NULL,
	`count` int NOT NULL,
	`expiresAt` datetime(3) NOT NULL,
	CONSTRAINT `contactGuard_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE INDEX `contactGuard_expiry` ON `contactGuard` (`expiresAt`);