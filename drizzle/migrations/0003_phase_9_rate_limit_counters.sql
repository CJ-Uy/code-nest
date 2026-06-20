CREATE TABLE `rate_limit_counters` (
	`bucket_key` text NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`bucket_key`, `window_start`)
);

--> statement-breakpoint
CREATE INDEX `rate_limit_counters_window_start_idx` ON `rate_limit_counters` (`window_start`);
