ALTER TABLE `event_type_rules` ADD `label` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `event_type_rules` ADD `colour` text DEFAULT 'slate' NOT NULL;--> statement-breakpoint
ALTER TABLE `event_type_rules` ADD `active` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `event_type_rules` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE `event_type_rules` SET `label` = 'Official', `colour` = 'primary', `position` = 0 WHERE `type` = 'official';--> statement-breakpoint
UPDATE `event_type_rules` SET `label` = 'Casual',   `colour` = 'emerald', `position` = 1 WHERE `type` = 'casual';--> statement-breakpoint
UPDATE `event_type_rules` SET `label` = 'Birthday', `colour` = 'accent',  `position` = 2 WHERE `type` = 'birthday';
