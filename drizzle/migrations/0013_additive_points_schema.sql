CREATE TABLE `point_types` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL UNIQUE,
	`label` text NOT NULL,
	`counts_toward_retention` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`updated_by` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `event_point_awards` (
	`event_id` text NOT NULL,
	`point_type_id` text NOT NULL,
	`points` integer NOT NULL,
	PRIMARY KEY(`event_id`, `point_type_id`),
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`point_type_id`) REFERENCES `point_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `retention_records`
	ADD COLUMN `point_type_id` text NOT NULL DEFAULT 'pt_retention';
--> statement-breakpoint
CREATE UNIQUE INDEX `retention_records_event_member_type_idx`
	ON `retention_records` (`event_id`, `member_id`, `point_type_id`)
	WHERE `source` = 'event_attendance';
