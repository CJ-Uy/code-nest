ALTER TABLE `crs_events` ADD `deleted_at` integer;--> statement-breakpoint
CREATE TABLE `event_staff` (
	`event_id` text NOT NULL,
	`member_id` text NOT NULL,
	`role` text NOT NULL,
	`added_by` text,
	`added_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`event_id`, `member_id`),
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`added_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT `event_staff_role_check` CHECK(`role` in ('admin', 'scanner'))
);
--> statement-breakpoint
CREATE INDEX `event_staff_member_id_idx` ON `event_staff` (`member_id`);--> statement-breakpoint
CREATE TABLE `event_invites` (
	`event_id` text NOT NULL,
	`member_id` text NOT NULL,
	`invited_by` text,
	`invited_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`event_id`, `member_id`),
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`invited_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `event_invites_member_invited_idx` ON `event_invites` (`member_id`,`invited_at`);
