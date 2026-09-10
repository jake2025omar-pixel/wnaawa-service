CREATE TABLE `reward_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(128) NOT NULL,
	`provider` varchar(64) NOT NULL,
	`placement` varchar(64) NOT NULL,
	`points` int NOT NULL DEFAULT 5,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_claims_id` PRIMARY KEY(`id`),
	CONSTRAINT `reward_claims_sessionId_unique` UNIQUE(`sessionId`)
);
