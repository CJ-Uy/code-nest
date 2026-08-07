CREATE TABLE `nav_pins` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`icon` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `nav_pins_position_idx` ON `nav_pins` (`position`);
--> statement-breakpoint
INSERT OR IGNORE INTO `roles` (`id`, `key`, `label`, `description`, `kind`) VALUES
	('role_calendar', 'calendar', 'Calendar', 'Manages shared dates.', 'admin'),
	('role_publishing', 'publishing', 'Publishing', 'Publishes public and member content.', 'admin'),
	('role_link', 'link', 'Links', 'Moderates short links.', 'admin'),
	('role_crs', 'crs', 'CRS', 'Approves events and points.', 'admin'),
	('role_member_admin', 'member_admin', 'Member admin', 'Manages members, roles, and nav pins.', 'admin');
