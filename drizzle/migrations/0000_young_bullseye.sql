CREATE TABLE `accounts` (
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	PRIMARY KEY(`provider`, `provider_account_id`),
	FOREIGN KEY (`user_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accounts_user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `announcements` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`tag` text,
	`audience_kind` text NOT NULL,
	`audience_value` text,
	`pinned_until` integer,
	`scheduled_for` integer,
	`published_at` integer,
	`author_member_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`author_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `announcements_published_at_idx` ON `announcements` (`published_at`);--> statement-breakpoint
CREATE INDEX `announcements_audience_idx` ON `announcements` (`audience_kind`,`audience_value`);--> statement-breakpoint
CREATE INDEX `announcements_pinned_until_idx` ON `announcements` (`pinned_until`);--> statement-breakpoint
CREATE TABLE `article_acl` (
	`article_id` text NOT NULL,
	`principal_type` text NOT NULL,
	`principal_id` text NOT NULL,
	PRIMARY KEY(`article_id`, `principal_type`, `principal_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_acl_article_id_idx` ON `article_acl` (`article_id`);--> statement-breakpoint
CREATE TABLE `article_components` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`position` integer NOT NULL,
	`kind` text NOT NULL,
	`title` text,
	`body` text,
	`data_json` text,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_components_article_id_idx` ON `article_components` (`article_id`);--> statement-breakpoint
CREATE TABLE `article_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`position` integer NOT NULL,
	`prompt` text NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_questions_article_id_idx` ON `article_questions` (`article_id`);--> statement-breakpoint
CREATE TABLE `article_refs` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`position` integer NOT NULL,
	`label` text NOT NULL,
	`href` text,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_refs_article_id_idx` ON `article_refs` (`article_id`);--> statement-breakpoint
CREATE TABLE `article_related` (
	`article_id` text NOT NULL,
	`related_id` text NOT NULL,
	PRIMARY KEY(`article_id`, `related_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`related_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `article_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`position` integer NOT NULL,
	`heading` text,
	`body` text NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_sections_article_id_idx` ON `article_sections` (`article_id`);--> statement-breakpoint
CREATE TABLE `article_topics` (
	`article_id` text NOT NULL,
	`topic_id` text NOT NULL,
	PRIMARY KEY(`article_id`, `topic_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `article_topics_topic_id_idx` ON `article_topics` (`topic_id`);--> statement-breakpoint
CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`confidentiality` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`dek` text NOT NULL,
	`abstract` text NOT NULL,
	`author` text NOT NULL,
	`client` text,
	`read_time` text NOT NULL,
	`locked` integer DEFAULT false NOT NULL,
	`date_sort` integer NOT NULL,
	`published_at` integer,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_unique` ON `articles` (`slug`);--> statement-breakpoint
CREATE INDEX `articles_slug_idx` ON `articles` (`slug`);--> statement-breakpoint
CREATE INDEX `articles_confidentiality_idx` ON `articles` (`confidentiality`);--> statement-breakpoint
CREATE INDEX `articles_published_at_idx` ON `articles` (`published_at`);--> statement-breakpoint
CREATE INDEX `articles_date_sort_idx` ON `articles` (`date_sort`);--> statement-breakpoint
CREATE INDEX `articles_category_idx` ON `articles` (`category`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_member_id` text,
	`actor_context` text DEFAULT 'session' NOT NULL,
	`shared_token_hash` text,
	`shared_token_label` text,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`detail` text,
	`category` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`actor_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_category_created_idx` ON `audit_logs` (`category`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_member_id_idx` ON `audit_logs` (`actor_member_id`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`member_id` text NOT NULL,
	`parent_id` text,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_article_created_idx` ON `comments` (`article_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `comments_parent_id_idx` ON `comments` (`parent_id`);--> statement-breakpoint
CREATE TABLE `consultancy_teams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crs_attendance` (
	`event_id` text NOT NULL,
	`member_id` text NOT NULL,
	`scanned_at` integer NOT NULL,
	`scanned_by` text NOT NULL,
	PRIMARY KEY(`event_id`, `member_id`),
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`scanned_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `crs_attendance_member_id_idx` ON `crs_attendance` (`member_id`);--> statement-breakpoint
CREATE TABLE `crs_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`points` integer,
	`place` text NOT NULL,
	`capacity` integer,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`description` text NOT NULL,
	`created_by` text NOT NULL,
	`approved_by` text,
	`approved_at` integer,
	`checkin_secret` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`approved_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `crs_events_status_idx` ON `crs_events` (`status`);--> statement-breakpoint
CREATE INDEX `crs_events_starts_at_idx` ON `crs_events` (`starts_at`);--> statement-breakpoint
CREATE INDEX `crs_events_type_idx` ON `crs_events` (`type`);--> statement-breakpoint
CREATE INDEX `crs_events_created_by_idx` ON `crs_events` (`created_by`);--> statement-breakpoint
CREATE TABLE `event_forum_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`member_id` text NOT NULL,
	`anonymous` integer DEFAULT false NOT NULL,
	`parent_id` text,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_forum_posts_event_created_idx` ON `event_forum_posts` (`event_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `event_forum_posts_parent_id_idx` ON `event_forum_posts` (`parent_id`);--> statement-breakpoint
CREATE TABLE `event_media` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`caption` text,
	`uploaded_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_media_event_id_idx` ON `event_media` (`event_id`);--> statement-breakpoint
CREATE TABLE `event_rsvps` (
	`event_id` text NOT NULL,
	`member_id` text NOT NULL,
	`state` text DEFAULT 'none' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`event_id`, `member_id`),
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `event_rsvps_member_id_idx` ON `event_rsvps` (`member_id`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`member_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`member_id`, `article_id`),
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `favorites_article_id_idx` ON `favorites` (`article_id`);--> statement-breakpoint
CREATE TABLE `link_daily_stats` (
	`link_id` text NOT NULL,
	`date` text NOT NULL,
	`referrer_bucket` text NOT NULL,
	`device_bucket` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`link_id`, `date`, `referrer_bucket`, `device_bucket`),
	FOREIGN KEY (`link_id`) REFERENCES `short_links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `link_daily_stats_link_date_idx` ON `link_daily_stats` (`link_id`,`date`);--> statement-breakpoint
CREATE TABLE `list_items` (
	`list_id` text NOT NULL,
	`article_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`list_id`, `article_id`),
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lists` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lists_member_id_idx` ON `lists` (`member_id`);--> statement-breakpoint
CREATE TABLE `member_feed_state` (
	`member_id` text PRIMARY KEY NOT NULL,
	`announcements_seen_at` integer,
	`surveys_seen_at` integer,
	`events_seen_at` integer,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `member_roles` (
	`member_id` text NOT NULL,
	`role_id` text NOT NULL,
	`assigned_by` text,
	`assigned_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`member_id`, `role_id`),
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assigned_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `member_roles_role_id_idx` ON `member_roles` (`role_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer,
	`name` text,
	`image` text,
	`full_name` text,
	`nickname` text,
	`pronouns` text,
	`batch` text,
	`birthday` text,
	`birthday_private` integer DEFAULT true NOT NULL,
	`avatar_key` text,
	`status` text DEFAULT 'active' NOT NULL,
	`tour_member_done` integer DEFAULT false NOT NULL,
	`tour_admin_done` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `members_email_idx` ON `members` (`email`);--> statement-breakpoint
CREATE INDEX `members_status_idx` ON `members` (`status`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`href` text,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_member_read_created_idx` ON `notifications` (`member_id`,`read_at`,`created_at`);--> statement-breakpoint
CREATE TABLE `point_awards` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`term_id` text NOT NULL,
	`event_id` text,
	`points` integer NOT NULL,
	`reason` text NOT NULL,
	`awarded_by` text NOT NULL,
	`awarded_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`awarded_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `point_awards_member_term_idx` ON `point_awards` (`member_id`,`term_id`);--> statement-breakpoint
CREATE INDEX `point_awards_term_id_idx` ON `point_awards` (`term_id`);--> statement-breakpoint
CREATE TABLE `reserved_slugs` (
	`slug` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`kind` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_key_unique` ON `roles` (`key`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`session_token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `shared_dev_tokens` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`label` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `short_links` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`destination_url` text NOT NULL,
	`title` text NOT NULL,
	`owner_member_id` text NOT NULL,
	`click_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`owner_member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `short_links_slug_unique` ON `short_links` (`slug`);--> statement-breakpoint
CREATE INDEX `short_links_slug_idx` ON `short_links` (`slug`);--> statement-breakpoint
CREATE INDEX `short_links_owner_member_id_idx` ON `short_links` (`owner_member_id`);--> statement-breakpoint
CREATE TABLE `survey_answers` (
	`id` text PRIMARY KEY NOT NULL,
	`response_id` text NOT NULL,
	`question_id` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`response_id`) REFERENCES `survey_responses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`question_id`) REFERENCES `survey_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `survey_assignments` (
	`survey_id` text NOT NULL,
	`member_id` text NOT NULL,
	`response_token_hash` text NOT NULL,
	`assigned_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`completed_at` integer,
	PRIMARY KEY(`survey_id`, `member_id`),
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `survey_assignments_response_token_hash_unique` ON `survey_assignments` (`response_token_hash`);--> statement-breakpoint
CREATE INDEX `survey_assignments_member_id_idx` ON `survey_assignments` (`member_id`);--> statement-breakpoint
CREATE INDEX `survey_assignments_response_token_hash_idx` ON `survey_assignments` (`response_token_hash`);--> statement-breakpoint
CREATE TABLE `survey_questions` (
	`id` text PRIMARY KEY NOT NULL,
	`survey_id` text NOT NULL,
	`position` integer NOT NULL,
	`type` text NOT NULL,
	`prompt` text NOT NULL,
	`options_json` text,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `survey_questions_survey_id_idx` ON `survey_questions` (`survey_id`);--> statement-breakpoint
CREATE TABLE `survey_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`survey_id` text NOT NULL,
	`submitted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` text PRIMARY KEY NOT NULL,
	`event_id` text,
	`title` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`sample_size` integer,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `crs_events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `surveys_status_idx` ON `surveys` (`status`);--> statement-breakpoint
CREATE INDEX `surveys_event_id_idx` ON `surveys` (`event_id`);--> statement-breakpoint
CREATE TABLE `team_members` (
	`team_id` text NOT NULL,
	`member_id` text NOT NULL,
	PRIMARY KEY(`team_id`, `member_id`),
	FOREIGN KEY (`team_id`) REFERENCES `consultancy_teams`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_members_member_id_idx` ON `team_members` (`member_id`);--> statement-breakpoint
CREATE TABLE `terms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`retained_at` integer NOT NULL,
	`probation_below` integer NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `terms_starts_ends_idx` ON `terms` (`starts_at`,`ends_at`);--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `topics_name_unique` ON `topics` (`name`);--> statement-breakpoint
CREATE TABLE `verification_token` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL,
	PRIMARY KEY(`identifier`, `token`)
);
