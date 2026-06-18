import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export type MemberStatus = "active" | "pending" | "inactive";
export type ArticleKind = "article" | "case";
export type ArticleConfidentiality = "public" | "members" | "confidential";
export type PrincipalType = "member" | "role" | "team";
export type EventType = "official" | "casual" | "birthday";
export type EventStatus = "pending" | "approved" | "rejected";
export type RsvpState = "going" | "none";
export type SurveyStatus = "draft" | "running" | "closed";
export type SurveyQuestionType = "scale" | "text" | "choice";
export type AnnouncementAudienceKind = "all" | "role" | "batch";
export type AuditActorContext = "session" | "shared_dev_token";
export type AuditCategory = "role" | "event" | "content" | "survey" | "link" | "member";

const nowMs = sql`(unixepoch() * 1000)`;

export const members = sqliteTable(
	"members",
	{
		id: text("id").primaryKey(),
		email: text("email").notNull(),
		emailVerified: integer("email_verified", { mode: "timestamp_ms" }),
		name: text("name"),
		image: text("image"),
		fullName: text("full_name"),
		nickname: text("nickname"),
		pronouns: text("pronouns"),
		batch: text("batch"),
		birthday: text("birthday"),
		birthdayPrivate: integer("birthday_private", { mode: "boolean" }).notNull().default(true),
		avatarKey: text("avatar_key"),
		status: text("status").$type<MemberStatus>().notNull().default("active"),
		tourMemberDone: integer("tour_member_done", { mode: "boolean" }).notNull().default(false),
		tourAdminDone: integer("tour_admin_done", { mode: "boolean" }).notNull().default(false),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [
		uniqueIndex("members_email_unique").on(table.email),
		index("members_email_idx").on(table.email),
		index("members_status_idx").on(table.status),
	],
);

export const accounts = sqliteTable(
	"accounts",
	{
		userId: text("user_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		type: text("type").notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("provider_account_id").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(table) => [
		primaryKey({ columns: [table.provider, table.providerAccountId] }),
		index("accounts_user_id_idx").on(table.userId),
	],
);

export const sessions = sqliteTable(
	"sessions",
	{
		sessionToken: text("session_token").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const verificationToken = sqliteTable(
	"verification_token",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const roles = sqliteTable("roles", {
	id: text("id").primaryKey(),
	key: text("key").notNull().unique(),
	label: text("label").notNull(),
	description: text("description").notNull(),
	kind: text("kind").notNull(),
});

export const memberRoles = sqliteTable(
	"member_roles",
	{
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		roleId: text("role_id")
			.notNull()
			.references(() => roles.id, { onDelete: "cascade" }),
		assignedBy: text("assigned_by").references(() => members.id, { onDelete: "set null" }),
		assignedAt: integer("assigned_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [primaryKey({ columns: [table.memberId, table.roleId] }), index("member_roles_role_id_idx").on(table.roleId)],
);

export const sharedDevTokens = sqliteTable("shared_dev_tokens", {
	tokenHash: text("token_hash").primaryKey(),
	memberId: text("member_id")
		.notNull()
		.references(() => members.id, { onDelete: "cascade" }),
	label: text("label").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
});

export const consultancyTeams = sqliteTable("consultancy_teams", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
});

export const teamMembers = sqliteTable(
	"team_members",
	{
		teamId: text("team_id")
			.notNull()
			.references(() => consultancyTeams.id, { onDelete: "cascade" }),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.teamId, table.memberId] }), index("team_members_member_id_idx").on(table.memberId)],
);

export const articles = sqliteTable(
	"articles",
	{
		id: text("id").primaryKey(),
		slug: text("slug").notNull().unique(),
		kind: text("kind").$type<ArticleKind>().notNull(),
		confidentiality: text("confidentiality").$type<ArticleConfidentiality>().notNull(),
		category: text("category").notNull(),
		title: text("title").notNull(),
		dek: text("dek").notNull(),
		abstract: text("abstract").notNull(),
		author: text("author").notNull(),
		client: text("client"),
		readTime: text("read_time").notNull(),
		locked: integer("locked", { mode: "boolean" }).notNull().default(false),
		dateSort: integer("date_sort").notNull(),
		publishedAt: integer("published_at", { mode: "timestamp_ms" }),
		createdBy: text("created_by").references(() => members.id, { onDelete: "set null" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [
		index("articles_slug_idx").on(table.slug),
		index("articles_confidentiality_idx").on(table.confidentiality),
		index("articles_published_at_idx").on(table.publishedAt),
		index("articles_date_sort_idx").on(table.dateSort),
		index("articles_category_idx").on(table.category),
	],
);

export const articleSections = sqliteTable(
	"article_sections",
	{
		id: text("id").primaryKey(),
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
		heading: text("heading"),
		body: text("body").notNull(),
	},
	(table) => [index("article_sections_article_id_idx").on(table.articleId)],
);

export const articleComponents = sqliteTable(
	"article_components",
	{
		id: text("id").primaryKey(),
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
		kind: text("kind").notNull(),
		title: text("title"),
		body: text("body"),
		dataJson: text("data_json"),
	},
	(table) => [index("article_components_article_id_idx").on(table.articleId)],
);

export const articleQuestions = sqliteTable(
	"article_questions",
	{
		id: text("id").primaryKey(),
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
		prompt: text("prompt").notNull(),
	},
	(table) => [index("article_questions_article_id_idx").on(table.articleId)],
);

export const articleRefs = sqliteTable(
	"article_refs",
	{
		id: text("id").primaryKey(),
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
		label: text("label").notNull(),
		href: text("href"),
	},
	(table) => [index("article_refs_article_id_idx").on(table.articleId)],
);

export const topics = sqliteTable("topics", {
	id: text("id").primaryKey(),
	name: text("name").notNull().unique(),
});

export const articleTopics = sqliteTable(
	"article_topics",
	{
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		topicId: text("topic_id")
			.notNull()
			.references(() => topics.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.articleId, table.topicId] }), index("article_topics_topic_id_idx").on(table.topicId)],
);

export const articleRelated = sqliteTable(
	"article_related",
	{
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		relatedId: text("related_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.articleId, table.relatedId] })],
);

export const articleAcl = sqliteTable(
	"article_acl",
	{
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		principalType: text("principal_type").$type<PrincipalType>().notNull(),
		principalId: text("principal_id").notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.articleId, table.principalType, table.principalId] }),
		index("article_acl_article_id_idx").on(table.articleId),
	],
);

export const favorites = sqliteTable(
	"favorites",
	{
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [primaryKey({ columns: [table.memberId, table.articleId] }), index("favorites_article_id_idx").on(table.articleId)],
);

export const lists = sqliteTable(
	"lists",
	{
		id: text("id").primaryKey(),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		color: text("color").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [index("lists_member_id_idx").on(table.memberId)],
);

export const listItems = sqliteTable(
	"list_items",
	{
		listId: text("list_id")
			.notNull()
			.references(() => lists.id, { onDelete: "cascade" }),
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
	},
	(table) => [primaryKey({ columns: [table.listId, table.articleId] })],
);

export const comments = sqliteTable(
	"comments",
	{
		id: text("id").primaryKey(),
		articleId: text("article_id")
			.notNull()
			.references(() => articles.id, { onDelete: "cascade" }),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		parentId: text("parent_id"),
		body: text("body").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [
		index("comments_article_created_idx").on(table.articleId, table.createdAt),
		index("comments_parent_id_idx").on(table.parentId),
	],
);

export const shortLinks = sqliteTable(
	"short_links",
	{
		id: text("id").primaryKey(),
		slug: text("slug").notNull().unique(),
		destinationUrl: text("destination_url").notNull(),
		title: text("title").notNull(),
		ownerMemberId: text("owner_member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		clickCount: integer("click_count").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [index("short_links_slug_idx").on(table.slug), index("short_links_owner_member_id_idx").on(table.ownerMemberId)],
);

export const reservedSlugs = sqliteTable("reserved_slugs", {
	slug: text("slug").primaryKey(),
});

export const linkDailyStats = sqliteTable(
	"link_daily_stats",
	{
		linkId: text("link_id")
			.notNull()
			.references(() => shortLinks.id, { onDelete: "cascade" }),
		date: text("date").notNull(),
		referrerBucket: text("referrer_bucket").notNull(),
		deviceBucket: text("device_bucket").notNull(),
		count: integer("count").notNull().default(0),
	},
	(table) => [
		primaryKey({ columns: [table.linkId, table.date, table.referrerBucket, table.deviceBucket] }),
		index("link_daily_stats_link_date_idx").on(table.linkId, table.date),
	],
);

export const crsEvents = sqliteTable(
	"crs_events",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		type: text("type").$type<EventType>().notNull(),
		status: text("status").$type<EventStatus>().notNull().default("pending"),
		points: integer("points"),
		place: text("place").notNull(),
		capacity: integer("capacity"),
		startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
		endsAt: integer("ends_at", { mode: "timestamp_ms" }),
		description: text("description").notNull(),
		createdBy: text("created_by")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		approvedBy: text("approved_by").references(() => members.id, { onDelete: "set null" }),
		approvedAt: integer("approved_at", { mode: "timestamp_ms" }),
		checkinSecret: text("checkin_secret").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [
		index("crs_events_status_idx").on(table.status),
		index("crs_events_starts_at_idx").on(table.startsAt),
		index("crs_events_type_idx").on(table.type),
		index("crs_events_created_by_idx").on(table.createdBy),
	],
);

export const eventRsvps = sqliteTable(
	"event_rsvps",
	{
		eventId: text("event_id")
			.notNull()
			.references(() => crsEvents.id, { onDelete: "cascade" }),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		state: text("state").$type<RsvpState>().notNull().default("none"),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [primaryKey({ columns: [table.eventId, table.memberId] }), index("event_rsvps_member_id_idx").on(table.memberId)],
);

export const crsAttendance = sqliteTable(
	"crs_attendance",
	{
		eventId: text("event_id")
			.notNull()
			.references(() => crsEvents.id, { onDelete: "cascade" }),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		scannedAt: integer("scanned_at", { mode: "timestamp_ms" }).notNull(),
		scannedBy: text("scanned_by")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
	},
	(table) => [primaryKey({ columns: [table.eventId, table.memberId] }), index("crs_attendance_member_id_idx").on(table.memberId)],
);

export const eventMedia = sqliteTable(
	"event_media",
	{
		id: text("id").primaryKey(),
		eventId: text("event_id")
			.notNull()
			.references(() => crsEvents.id, { onDelete: "cascade" }),
		r2Key: text("r2_key").notNull(),
		caption: text("caption"),
		uploadedBy: text("uploaded_by")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [index("event_media_event_id_idx").on(table.eventId)],
);

export const eventForumPosts = sqliteTable(
	"event_forum_posts",
	{
		id: text("id").primaryKey(),
		eventId: text("event_id")
			.notNull()
			.references(() => crsEvents.id, { onDelete: "cascade" }),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		anonymous: integer("anonymous", { mode: "boolean" }).notNull().default(false),
		parentId: text("parent_id"),
		body: text("body").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [
		index("event_forum_posts_event_created_idx").on(table.eventId, table.createdAt),
		index("event_forum_posts_parent_id_idx").on(table.parentId),
	],
);

export const terms = sqliteTable(
	"terms",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		retainedAt: integer("retained_at").notNull(),
		probationBelow: integer("probation_below").notNull(),
		startsAt: integer("starts_at", { mode: "timestamp_ms" }).notNull(),
		endsAt: integer("ends_at", { mode: "timestamp_ms" }).notNull(),
	},
	(table) => [index("terms_starts_ends_idx").on(table.startsAt, table.endsAt)],
);

export const pointAwards = sqliteTable(
	"point_awards",
	{
		id: text("id").primaryKey(),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		termId: text("term_id")
			.notNull()
			.references(() => terms.id, { onDelete: "cascade" }),
		eventId: text("event_id").references(() => crsEvents.id, { onDelete: "set null" }),
		points: integer("points").notNull(),
		reason: text("reason").notNull(),
		awardedBy: text("awarded_by")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		awardedAt: integer("awarded_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [index("point_awards_member_term_idx").on(table.memberId, table.termId), index("point_awards_term_id_idx").on(table.termId)],
);

export const surveys = sqliteTable(
	"surveys",
	{
		id: text("id").primaryKey(),
		eventId: text("event_id").references(() => crsEvents.id, { onDelete: "set null" }),
		title: text("title").notNull(),
		status: text("status").$type<SurveyStatus>().notNull().default("draft"),
		sampleSize: integer("sample_size"),
		createdBy: text("created_by")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [index("surveys_status_idx").on(table.status), index("surveys_event_id_idx").on(table.eventId)],
);

export const surveyQuestions = sqliteTable(
	"survey_questions",
	{
		id: text("id").primaryKey(),
		surveyId: text("survey_id")
			.notNull()
			.references(() => surveys.id, { onDelete: "cascade" }),
		position: integer("position").notNull(),
		type: text("type").$type<SurveyQuestionType>().notNull(),
		prompt: text("prompt").notNull(),
		optionsJson: text("options_json"),
	},
	(table) => [index("survey_questions_survey_id_idx").on(table.surveyId)],
);

export const surveyAssignments = sqliteTable(
	"survey_assignments",
	{
		surveyId: text("survey_id")
			.notNull()
			.references(() => surveys.id, { onDelete: "cascade" }),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		responseTokenHash: text("response_token_hash").notNull().unique(),
		assignedAt: integer("assigned_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
		completedAt: integer("completed_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		primaryKey({ columns: [table.surveyId, table.memberId] }),
		index("survey_assignments_member_id_idx").on(table.memberId),
		index("survey_assignments_response_token_hash_idx").on(table.responseTokenHash),
	],
);

export const surveyResponses = sqliteTable("survey_responses", {
	id: text("id").primaryKey(),
	surveyId: text("survey_id")
		.notNull()
		.references(() => surveys.id, { onDelete: "cascade" }),
	submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
});

export const surveyAnswers = sqliteTable("survey_answers", {
	id: text("id").primaryKey(),
	responseId: text("response_id")
		.notNull()
		.references(() => surveyResponses.id, { onDelete: "cascade" }),
	questionId: text("question_id")
		.notNull()
		.references(() => surveyQuestions.id, { onDelete: "cascade" }),
	value: text("value").notNull(),
});

export const announcements = sqliteTable(
	"announcements",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		body: text("body").notNull(),
		tag: text("tag"),
		audienceKind: text("audience_kind").$type<AnnouncementAudienceKind>().notNull(),
		audienceValue: text("audience_value"),
		pinnedUntil: integer("pinned_until", { mode: "timestamp_ms" }),
		scheduledFor: integer("scheduled_for", { mode: "timestamp_ms" }),
		publishedAt: integer("published_at", { mode: "timestamp_ms" }),
		authorMemberId: text("author_member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [
		index("announcements_published_at_idx").on(table.publishedAt),
		index("announcements_audience_idx").on(table.audienceKind, table.audienceValue),
		index("announcements_pinned_until_idx").on(table.pinnedUntil),
	],
);

export const memberFeedState = sqliteTable("member_feed_state", {
	memberId: text("member_id")
		.primaryKey()
		.references(() => members.id, { onDelete: "cascade" }),
	announcementsSeenAt: integer("announcements_seen_at", { mode: "timestamp_ms" }),
	surveysSeenAt: integer("surveys_seen_at", { mode: "timestamp_ms" }),
	eventsSeenAt: integer("events_seen_at", { mode: "timestamp_ms" }),
});

export const notifications = sqliteTable(
	"notifications",
	{
		id: text("id").primaryKey(),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		kind: text("kind").notNull(),
		title: text("title").notNull(),
		body: text("body").notNull(),
		href: text("href"),
		readAt: integer("read_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [index("notifications_member_read_created_idx").on(table.memberId, table.readAt, table.createdAt)],
);

export const auditLogs = sqliteTable(
	"audit_logs",
	{
		id: text("id").primaryKey(),
		actorMemberId: text("actor_member_id").references(() => members.id, { onDelete: "set null" }),
		actorContext: text("actor_context").$type<AuditActorContext>().notNull().default("session"),
		sharedTokenHash: text("shared_token_hash"),
		sharedTokenLabel: text("shared_token_label"),
		action: text("action").notNull(),
		targetType: text("target_type").notNull(),
		targetId: text("target_id").notNull(),
		detail: text("detail"),
		category: text("category").$type<AuditCategory>().notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
	},
	(table) => [
		index("audit_logs_category_created_idx").on(table.category, table.createdAt),
		index("audit_logs_actor_member_id_idx").on(table.actorMemberId),
	],
);
