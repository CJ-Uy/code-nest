CREATE TABLE `link_hourly_stats` (
	`link_id` text NOT NULL,
	`hour` text NOT NULL,
	`referrer_bucket` text NOT NULL,
	`device_bucket` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`link_id`, `hour`, `referrer_bucket`, `device_bucket`),
	FOREIGN KEY (`link_id`) REFERENCES `short_links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `link_hourly_stats_link_hour_idx` ON `link_hourly_stats` (`link_id`,`hour`);
