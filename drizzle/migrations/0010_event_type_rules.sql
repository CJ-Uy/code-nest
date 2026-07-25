CREATE TABLE `event_type_rules` (
	`type` text PRIMARY KEY NOT NULL,
	`required_permission` text,
	`updated_by` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`updated_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `event_type_rules` (`type`, `required_permission`) VALUES ('casual', NULL);--> statement-breakpoint
INSERT INTO `event_type_rules` (`type`, `required_permission`) VALUES ('birthday', NULL);--> statement-breakpoint
INSERT INTO `event_type_rules` (`type`, `required_permission`) VALUES ('official', 'event:create_restricted');
