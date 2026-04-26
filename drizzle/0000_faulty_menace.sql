CREATE TABLE `Account` (
	`userId` varchar(191) NOT NULL,
	`type` varchar(191) NOT NULL,
	`provider` varchar(191) NOT NULL,
	`providerAccountId` varchar(191) NOT NULL,
	`refresh_token` varchar(255),
	`access_token` varchar(255),
	`expires_at` int,
	`token_type` varchar(191),
	`scope` varchar(191),
	`id_token` text,
	`session_state` varchar(191)
);
--> statement-breakpoint
CREATE TABLE `GuestId` (
	`id` varchar(191) NOT NULL,
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `GuestId_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Map` (
	`id` varchar(191) NOT NULL,
	`nameZh` varchar(191),
	`nameEn` varchar(191),
	`description` text,
	`images` text NOT NULL,
	`submitterId` varchar(191) NOT NULL,
	`averageRating` double NOT NULL DEFAULT 0,
	`ratingCount` int NOT NULL DEFAULT 0,
	`workshopId` varchar(191),
	`steamData` text,
	`lastSyncAt` datetime(3),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `Map_id` PRIMARY KEY(`id`),
	CONSTRAINT `Map_workshopId_unique` UNIQUE(`workshopId`)
);
--> statement-breakpoint
CREATE TABLE `Rating` (
	`id` varchar(191) NOT NULL,
	`score` int NOT NULL,
	`comment` text,
	`mapId` varchar(191) NOT NULL,
	`userId` varchar(191),
	`guestId` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `Rating_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Session` (
	`sessionToken` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`expires` datetime(3) NOT NULL,
	CONSTRAINT `Session_sessionToken` PRIMARY KEY(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` varchar(191) NOT NULL,
	`steamId` varchar(191),
	`name` varchar(191),
	`email` varchar(191),
	`emailVerified` datetime(3),
	`avatar` varchar(191),
	`createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `User_id` PRIMARY KEY(`id`),
	CONSTRAINT `User_steamId_unique` UNIQUE(`steamId`),
	CONSTRAINT `User_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `VerificationToken` (
	`identifier` varchar(191) NOT NULL,
	`token` varchar(191) NOT NULL,
	`expires` datetime(3) NOT NULL
);
--> statement-breakpoint
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `GuestId_createdAt_idx` ON `GuestId` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Map_submitterId_idx` ON `Map` (`submitterId`);--> statement-breakpoint
CREATE INDEX `Map_createdAt_idx` ON `Map` (`createdAt`);--> statement-breakpoint
CREATE INDEX `Map_averageRating_idx` ON `Map` (`averageRating`);--> statement-breakpoint
CREATE INDEX `Map_workshopId_idx` ON `Map` (`workshopId`);--> statement-breakpoint
CREATE INDEX `Rating_mapId_idx` ON `Rating` (`mapId`);--> statement-breakpoint
CREATE INDEX `Rating_userId_idx` ON `Rating` (`userId`);--> statement-breakpoint
CREATE INDEX `Rating_guestId_idx` ON `Rating` (`guestId`);--> statement-breakpoint
CREATE INDEX `User_steamId_idx` ON `User` (`steamId`);