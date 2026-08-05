CREATE TABLE `announcement_reads` (
	`announcement_id` text NOT NULL,
	`member_id` text NOT NULL,
	`read_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`announcement_id`, `member_id`),
	FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `announcement_reads_member_id_idx` ON `announcement_reads` (`member_id`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`tag` text DEFAULT 'CODE' NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`audience` text DEFAULT 'all' NOT NULL,
	`linked_event_id` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`linked_event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `announcements_pinned_idx` ON `announcements` (`pinned`,`created_at`);--> statement-breakpoint
INSERT OR IGNORE INTO `roles` (`id`, `key`, `label`, `description`, `kind`) VALUES ('role_publishing', 'publishing', 'Publishing', 'Manages announcements and the content library.', 'admin');
