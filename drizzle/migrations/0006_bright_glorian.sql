CREATE TABLE `library_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`library_item_id` text NOT NULL,
	`member_id` text NOT NULL,
	`parent_id` text,
	`anonymous` integer DEFAULT false NOT NULL,
	`body` text NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`library_item_id`) REFERENCES `library_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `library_comments_library_item_id_idx` ON `library_comments` (`library_item_id`);--> statement-breakpoint
CREATE TABLE `library_favorites` (
	`member_id` text NOT NULL,
	`library_item_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`member_id`, `library_item_id`),
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`library_item_id`) REFERENCES `library_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `library_items` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text DEFAULT 'article' NOT NULL,
	`confidentiality` text DEFAULT 'members' NOT NULL,
	`category` text DEFAULT 'General' NOT NULL,
	`title` text NOT NULL,
	`dek` text DEFAULT '' NOT NULL,
	`read_minutes` integer DEFAULT 5 NOT NULL,
	`abstract` text DEFAULT '' NOT NULL,
	`sections_json` text DEFAULT '[]' NOT NULL,
	`components_json` text DEFAULT '[]' NOT NULL,
	`questions_json` text DEFAULT '[]' NOT NULL,
	`references_json` text DEFAULT '[]' NOT NULL,
	`topics_json` text DEFAULT '[]' NOT NULL,
	`created_by` text,
	`published_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `library_items_category_idx` ON `library_items` (`category`);--> statement-breakpoint
CREATE INDEX `library_items_published_at_idx` ON `library_items` (`published_at`);--> statement-breakpoint
CREATE TABLE `library_list_items` (
	`list_id` text NOT NULL,
	`library_item_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`list_id`, `library_item_id`),
	FOREIGN KEY (`list_id`) REFERENCES `library_lists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`library_item_id`) REFERENCES `library_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `library_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#0c315c' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
