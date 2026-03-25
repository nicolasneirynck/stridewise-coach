ALTER TABLE `activities` MODIFY COLUMN `source_activity_id` bigint unsigned;--> statement-breakpoint
ALTER TABLE `activities` ADD `activity_type` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `activities` ADD `duration` int NOT NULL;