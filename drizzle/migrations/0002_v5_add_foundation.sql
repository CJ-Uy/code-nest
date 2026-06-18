CREATE TABLE `nav_pins` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`icon` text NOT NULL,
	`position` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);

--> statement-breakpoint
CREATE INDEX `nav_pins_position_idx` ON `nav_pins` (`position`);
--> statement-breakpoint
CREATE TABLE `quick_links` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`position` integer NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);

--> statement-breakpoint
CREATE INDEX `quick_links_position_idx` ON `quick_links` (`position`);
--> statement-breakpoint
CREATE TABLE `retention_records` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`term_id` text NOT NULL,
	`event_id` text,
	`points` integer,
	`reason` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`recorded_by` text NOT NULL,
	`recorded_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`recorded_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);

--> statement-breakpoint
CREATE INDEX `retention_records_member_term_idx` ON `retention_records` (`member_id`,`term_id`);
--> statement-breakpoint
CREATE INDEX `retention_records_term_id_idx` ON `retention_records` (`term_id`);
--> statement-breakpoint
CREATE INDEX `retention_records_event_id_idx` ON `retention_records` (`event_id`);
--> statement-breakpoint
CREATE TABLE `term_member_roster` (
	`term_id` text NOT NULL,
	`email` text NOT NULL,
	`member_id` text,
	`added_by` text NOT NULL,
	`added_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`term_id`, `email`),
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`added_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);

--> statement-breakpoint
CREATE INDEX `term_member_roster_term_id_idx` ON `term_member_roster` (`term_id`);
--> statement-breakpoint
CREATE INDEX `term_member_roster_email_idx` ON `term_member_roster` (`email`);
--> statement-breakpoint
ALTER TABLE `short_links` ADD `preview_title` text;
--> statement-breakpoint
ALTER TABLE `short_links` ADD `preview_description` text;
--> statement-breakpoint
ALTER TABLE `short_links` ADD `preview_image_key` text;
