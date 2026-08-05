ALTER TABLE `crs_events` ADD COLUMN `grace_minutes` integer;
--> statement-breakpoint
ALTER TABLE `audit_logs` ADD COLUMN `target_member_id` text REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null;
--> statement-breakpoint
CREATE INDEX `audit_logs_target_member_created_idx` ON `audit_logs` (`target_member_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `audit_logs_action_created_idx` ON `audit_logs` (`action`, `created_at`);
--> statement-breakpoint
UPDATE `audit_logs`
SET `target_member_id` = substr(`detail`, 8)
WHERE `category` = 'event'
  AND `action` IN ('event:scan_attendance', 'event:undo_scan')
  AND `detail` LIKE 'member=%'
  AND EXISTS (SELECT 1 FROM `members` WHERE `members`.`id` = substr(`audit_logs`.`detail`, 8));
