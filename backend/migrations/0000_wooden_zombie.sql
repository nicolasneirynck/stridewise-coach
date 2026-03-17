CREATE TABLE `strava_connections` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`strava_athlete_id` int NOT NULL,
	`access_token` varchar(255) NOT NULL,
	`refresh_token` varchar(255) NOT NULL,
	`expires_at` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strava_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_strava_connections_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `idx_user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `strava_connections` ADD CONSTRAINT `strava_connections_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;