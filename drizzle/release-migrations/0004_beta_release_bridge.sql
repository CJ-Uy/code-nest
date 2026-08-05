CREATE TABLE `quick_links` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`url` text NOT NULL,
	`position` integer NOT NULL,
	`created_by` text NOT NULL REFERENCES `members`(`id`) ON DELETE cascade,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quick_links_position_idx` ON `quick_links` (`position`);
--> statement-breakpoint
CREATE TABLE `term_member_roster` (
	`term_id` text NOT NULL REFERENCES `terms`(`id`) ON DELETE cascade,
	`email` text NOT NULL,
	`member_id` text REFERENCES `members`(`id`) ON DELETE set null,
	`added_by` text NOT NULL REFERENCES `members`(`id`) ON DELETE cascade,
	`added_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY (`term_id`, `email`)
);
--> statement-breakpoint
CREATE INDEX `term_member_roster_term_id_idx` ON `term_member_roster` (`term_id`);
--> statement-breakpoint
CREATE INDEX `term_member_roster_email_idx` ON `term_member_roster` (`email`);
--> statement-breakpoint
CREATE TABLE `rate_limit_counters` (
	`bucket_key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY (`bucket_key`, `window_start`)
);
--> statement-breakpoint
CREATE INDEX `rate_limit_counters_window_start_idx` ON `rate_limit_counters` (`window_start`);
--> statement-breakpoint
CREATE TABLE `point_types` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL UNIQUE,
	`label` text NOT NULL,
	`milestones_json` text DEFAULT '[]' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`updated_by` text REFERENCES `members`(`id`) ON DELETE set null,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `point_types` (`id`, `key`, `label`, `milestones_json`, `active`, `position`)
VALUES ('pt_retention', 'retention', 'Retention', '[]', 1, 0);
--> statement-breakpoint
CREATE TABLE `retention_records` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL REFERENCES `members`(`id`) ON DELETE cascade,
	`term_id` text NOT NULL REFERENCES `terms`(`id`) ON DELETE cascade,
	`event_id` text REFERENCES `crs_events`(`id`) ON DELETE set null,
	`point_type_id` text DEFAULT 'pt_retention' NOT NULL,
	`points` integer,
	`reason` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`recorded_by` text NOT NULL REFERENCES `members`(`id`) ON DELETE cascade,
	`recorded_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `retention_records_member_term_idx` ON `retention_records` (`member_id`, `term_id`);
--> statement-breakpoint
CREATE INDEX `retention_records_term_id_idx` ON `retention_records` (`term_id`);
--> statement-breakpoint
CREATE INDEX `retention_records_event_id_idx` ON `retention_records` (`event_id`);
--> statement-breakpoint
-- Release blocker: the target DB must pass the documented duplicate point_awards preflight before this migration runs.
INSERT INTO `retention_records`
	(`id`, `member_id`, `term_id`, `event_id`, `point_type_id`, `points`, `reason`, `source`, `recorded_by`, `recorded_at`)
SELECT
	`id`, `member_id`, `term_id`, `event_id`, 'pt_retention', `points`, `reason`,
	CASE WHEN `event_id` IS NULL THEN 'manual' ELSE 'event_attendance' END,
	`awarded_by`, `awarded_at`
FROM `point_awards`;
--> statement-breakpoint
CREATE UNIQUE INDEX `retention_records_event_member_type_idx`
ON `retention_records` (`event_id`, `member_id`, `point_type_id`)
WHERE `source` = 'event_attendance';
--> statement-breakpoint
CREATE TABLE `event_staff` (
	`event_id` text NOT NULL REFERENCES `crs_events`(`id`) ON DELETE cascade,
	`member_id` text NOT NULL REFERENCES `members`(`id`) ON DELETE cascade,
	`role` text NOT NULL CHECK (`role` in ('admin', 'scanner')),
	`added_by` text REFERENCES `members`(`id`) ON DELETE set null,
	`added_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY (`event_id`, `member_id`)
);
--> statement-breakpoint
CREATE INDEX `event_staff_member_id_idx` ON `event_staff` (`member_id`);
--> statement-breakpoint
CREATE TABLE `event_invites` (
	`event_id` text NOT NULL REFERENCES `crs_events`(`id`) ON DELETE cascade,
	`member_id` text NOT NULL REFERENCES `members`(`id`) ON DELETE cascade,
	`invited_by` text REFERENCES `members`(`id`) ON DELETE set null,
	`invited_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY (`event_id`, `member_id`)
);
--> statement-breakpoint
CREATE INDEX `event_invites_member_invited_idx` ON `event_invites` (`member_id`, `invited_at`);
--> statement-breakpoint
CREATE TABLE `event_type_rules` (
	`type` text PRIMARY KEY NOT NULL,
	`required_permission` text,
	`label` text DEFAULT '' NOT NULL,
	`colour` text DEFAULT 'slate' NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`updated_by` text REFERENCES `members`(`id`) ON DELETE set null,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `event_type_rules` (`type`, `required_permission`, `label`, `colour`, `active`, `position`) VALUES
	('official', 'event:create_restricted', 'Official', 'primary', 1, 0),
	('casual', NULL, 'Casual', 'emerald', 1, 1),
	('birthday', NULL, 'Birthday', 'accent', 1, 2);
--> statement-breakpoint
CREATE TABLE `event_point_awards` (
	`event_id` text NOT NULL REFERENCES `crs_events`(`id`) ON DELETE cascade,
	`point_type_id` text NOT NULL REFERENCES `point_types`(`id`),
	`points` integer NOT NULL,
	PRIMARY KEY (`event_id`, `point_type_id`)
);
--> statement-breakpoint
CREATE TABLE `link_hourly_stats` (
	`link_id` text NOT NULL REFERENCES `short_links`(`id`) ON DELETE cascade,
	`hour` text NOT NULL,
	`referrer_bucket` text NOT NULL,
	`device_bucket` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY (`link_id`, `hour`, `referrer_bucket`, `device_bucket`)
);
--> statement-breakpoint
CREATE INDEX `link_hourly_stats_link_hour_idx` ON `link_hourly_stats` (`link_id`, `hour`);
--> statement-breakpoint
ALTER TABLE `crs_events` ADD COLUMN `deleted_at` integer;
--> statement-breakpoint
ALTER TABLE `crs_events` ADD COLUMN `grace_minutes` integer;
--> statement-breakpoint
ALTER TABLE `crs_events` ADD COLUMN `rsvp_form_json` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
ALTER TABLE `crs_events` ADD COLUMN `rsvp_responses_public` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `crs_events` ADD COLUMN `all_day` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `crs_events` ADD COLUMN `read_only` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `crs_events` ADD COLUMN `public_code` text;
--> statement-breakpoint
ALTER TABLE `event_rsvps` ADD COLUMN `answers_json` text DEFAULT '{}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD COLUMN `target_member_id` text REFERENCES `members`(`id`) ON DELETE set null;
--> statement-breakpoint
CREATE INDEX `crs_events_ends_at_idx` ON `crs_events` (`ends_at`);
--> statement-breakpoint
UPDATE `crs_events`
SET `public_code` = upper(substr(hex(randomblob(8)), 1, 8))
WHERE `public_code` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `crs_events_public_code_idx` ON `crs_events` (`public_code`);
--> statement-breakpoint
CREATE INDEX `audit_logs_target_member_created_idx` ON `audit_logs` (`target_member_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `audit_logs_action_created_idx` ON `audit_logs` (`action`, `created_at`);
