INSERT OR IGNORE INTO `members` (`id`, `email`, `name`, `full_name`, `status`)
VALUES ('mem_charles', 'charles.joshua.uy@student.ateneo.edu', 'Charles Uy', 'Charles Joshua Uy', 'active');
--> statement-breakpoint
UPDATE `members`
SET
	`email` = 'charles.joshua.uy@student.ateneo.edu',
	`name` = 'Charles Uy',
	`full_name` = 'Charles Joshua Uy',
	`status` = 'active',
	`updated_at` = unixepoch() * 1000
WHERE `id` = 'mem_charles';
--> statement-breakpoint
INSERT OR IGNORE INTO `roles` (`id`, `key`, `label`, `description`, `kind`)
VALUES ('role_super', 'super', 'Super admin', 'Full portal access.', 'admin');
--> statement-breakpoint
DELETE FROM `member_roles`;
--> statement-breakpoint
INSERT INTO `member_roles` (`member_id`, `role_id`, `assigned_by`)
VALUES ('mem_charles', 'role_super', 'mem_charles');
--> statement-breakpoint
UPDATE `short_links`
SET
	`owner_member_id` = 'mem_charles',
	`updated_at` = unixepoch() * 1000;
--> statement-breakpoint
INSERT OR IGNORE INTO `reserved_slugs` (`slug`) VALUES
	('admin'),
	('api'),
	('favicon.ico'),
	('internal'),
	('portal'),
	('signin'),
	('_next');
