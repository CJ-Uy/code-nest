CREATE TABLE `article_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`article_slug` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `article_feedback_article_slug_idx` ON `article_feedback` (`article_slug`);--> statement-breakpoint
CREATE INDEX `article_feedback_created_at_idx` ON `article_feedback` (`created_at`);--> statement-breakpoint
CREATE TABLE `contact_submissions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization` text NOT NULL,
	`email` text NOT NULL,
	`org_segment` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contact_submissions_created_at_idx` ON `contact_submissions` (`created_at`);