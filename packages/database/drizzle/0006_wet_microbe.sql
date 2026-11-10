CREATE TABLE IF NOT EXISTS `contactGuard` (
	`key` varchar(80) NOT NULL,
	`count` int NOT NULL,
	`expiresAt` datetime(3) NOT NULL,
	CONSTRAINT `contactGuard_key` PRIMARY KEY(`key`),
	INDEX `contactGuard_expiry` (`expiresAt`)
);
