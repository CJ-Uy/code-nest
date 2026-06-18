DROP TABLE `announcements`;
--> statement-breakpoint
DROP TABLE `article_acl`;
--> statement-breakpoint
DROP TABLE `article_components`;
--> statement-breakpoint
DROP TABLE `article_questions`;
--> statement-breakpoint
DROP TABLE `article_refs`;
--> statement-breakpoint
DROP TABLE `article_related`;
--> statement-breakpoint
DROP TABLE `article_sections`;
--> statement-breakpoint
DROP TABLE `article_topics`;
--> statement-breakpoint
DROP TABLE `articles`;
--> statement-breakpoint
DROP TABLE `comments`;
--> statement-breakpoint
DROP TABLE `consultancy_teams`;
--> statement-breakpoint
DROP TABLE `favorites`;
--> statement-breakpoint
DROP TABLE `list_items`;
--> statement-breakpoint
DROP TABLE `lists`;
--> statement-breakpoint
DROP TABLE `point_awards`;
--> statement-breakpoint
DROP TABLE `team_members`;
--> statement-breakpoint
DROP TABLE `topics`;
--> statement-breakpoint
ALTER TABLE `member_feed_state` DROP COLUMN `announcements_seen_at`;
--> statement-breakpoint
ALTER TABLE `members` DROP COLUMN `tour_member_done`;
--> statement-breakpoint
ALTER TABLE `members` DROP COLUMN `tour_admin_done`;
