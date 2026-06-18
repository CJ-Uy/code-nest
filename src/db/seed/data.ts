import type { InferInsertModel } from "drizzle-orm";
import {
	announcements,
	articleSections,
	articles,
	auditLogs,
	consultancyTeams,
	crsEvents,
	linkDailyStats,
	members,
	memberRoles,
	reservedSlugs,
	roles,
	sharedDevTokens,
	shortLinks,
	surveyAssignments,
	surveyQuestions,
	surveys,
	teamMembers,
	terms,
} from "@/db/schema";

const now = new Date("2026-06-18T00:00:00.000Z");
const later = new Date("2026-07-10T10:00:00.000Z");

export const seedRoles: InferInsertModel<typeof roles>[] = [
	{ id: "role_super", key: "super", label: "Super admin", description: "Full portal access.", kind: "admin" },
	{ id: "role_calendar", key: "calendar", label: "Calendar", description: "Manages shared dates.", kind: "admin" },
	{ id: "role_publishing", key: "publishing", label: "Publishing", description: "Publishes public and member content.", kind: "admin" },
	{ id: "role_link", key: "link", label: "Links", description: "Moderates short links.", kind: "admin" },
	{ id: "role_crs", key: "crs", label: "CRS", description: "Approves events and points.", kind: "admin" },
	{ id: "role_member_admin", key: "member_admin", label: "Member admin", description: "Manages member profiles and roles.", kind: "admin" },
];

export const seedMembers: InferInsertModel<typeof members>[] = [
	{ id: "mem_demo_admin", email: "admin@example.com", name: "Demo Admin", fullName: "Demo Admin", batch: "2026", status: "active" },
	{ id: "mem_demo_member", email: "member@example.com", name: "Demo Member", fullName: "Demo Member", batch: "2027", status: "active" },
];

export const seedMemberRoles: InferInsertModel<typeof memberRoles>[] = [
	{ memberId: "mem_demo_admin", roleId: "role_super", assignedBy: "mem_demo_admin" },
];

export const seedTeams: InferInsertModel<typeof consultancyTeams>[] = [{ id: "team_blue", name: "Blue Team", createdAt: now }];

export const seedTeamMembers: InferInsertModel<typeof teamMembers>[] = [{ teamId: "team_blue", memberId: "mem_demo_member" }];

export const seedArticles: InferInsertModel<typeof articles>[] = [
	{
		id: "art_public_intro",
		slug: "member-formation-through-practice",
		kind: "article",
		confidentiality: "public",
		category: "Practice",
		title: "Member Formation Through Practice",
		dek: "How CODE turns consulting practice into member growth.",
		abstract: "A short public article for the publishing home.",
		author: "Ateneo CODE",
		readTime: "4 min",
		locked: false,
		dateSort: 20260618,
		publishedAt: now,
		createdBy: "mem_demo_admin",
	},
	{
		id: "art_member_points",
		slug: "what-retention-points-are-for",
		kind: "article",
		confidentiality: "members",
		category: "Membership",
		title: "What Retention Points Are For",
		dek: "A member-only explainer for CRS points.",
		abstract: "A private resource preview used by the library.",
		author: "Ateneo CODE",
		readTime: "3 min",
		locked: true,
		dateSort: 20260617,
		publishedAt: now,
		createdBy: "mem_demo_admin",
	},
];

export const seedArticleSections: InferInsertModel<typeof articleSections>[] = [
	{ id: "sec_public_intro_1", articleId: "art_public_intro", position: 1, heading: "Practice first", body: "CODE members learn by doing focused consulting work." },
	{ id: "sec_member_points_1", articleId: "art_member_points", position: 1, heading: "Retention", body: "Points help members track steady participation." },
];

export const seedReservedSlugs: InferInsertModel<typeof reservedSlugs>[] = [{ slug: "portal" }, { slug: "admin" }, { slug: "api" }];

export const seedShortLinks: InferInsertModel<typeof shortLinks>[] = [
	{
		id: "lnk_demo",
		slug: "welcome",
		destinationUrl: "https://example.com/code",
		title: "Welcome link",
		ownerMemberId: "mem_demo_admin",
		clickCount: 5,
	},
];

export const seedLinkDailyStats: InferInsertModel<typeof linkDailyStats>[] = [
	{ linkId: "lnk_demo", date: "2026-06-18", referrerBucket: "direct", deviceBucket: "desktop", count: 5 },
];

export const seedEvents: InferInsertModel<typeof crsEvents>[] = [
	{
		id: "evt_demo",
		title: "Consulting Practice Night",
		type: "official",
		status: "approved",
		points: 5,
		place: "SOM 111",
		startsAt: later,
		endsAt: new Date("2026-07-10T12:00:00.000Z"),
		description: "A sample CRS event for portal modules.",
		createdBy: "mem_demo_admin",
		approvedBy: "mem_demo_admin",
		approvedAt: now,
		checkinSecret: "demo-checkin-secret",
	},
];

export const seedTerms: InferInsertModel<typeof terms>[] = [
	{ id: "term_2026_1", name: "Term 1 2026", retainedAt: 20, probationBelow: 10, startsAt: now, endsAt: new Date("2026-10-31T00:00:00.000Z") },
];

export const seedSurveys: InferInsertModel<typeof surveys>[] = [
	{ id: "srv_demo", title: "Practice Night Feedback", status: "running", sampleSize: 1, eventId: "evt_demo", createdBy: "mem_demo_admin" },
];

export const seedSurveyQuestions: InferInsertModel<typeof surveyQuestions>[] = [
	{ id: "srvq_demo_1", surveyId: "srv_demo", position: 1, type: "scale", prompt: "How useful was the session?", optionsJson: "[1,2,3,4,5]" },
];

export const seedSurveyAssignments: InferInsertModel<typeof surveyAssignments>[] = [
	{ surveyId: "srv_demo", memberId: "mem_demo_member", responseTokenHash: "demo-response-token-hash" },
];

export const seedAnnouncements: InferInsertModel<typeof announcements>[] = [
	{ id: "ann_demo", title: "Welcome to the portal", body: "Use the portal to follow CODE work and member updates.", audienceKind: "all", authorMemberId: "mem_demo_admin", publishedAt: now },
];

export const seedAuditLogs: InferInsertModel<typeof auditLogs>[] = [
	{ id: "aud_demo", actorMemberId: "mem_demo_admin", action: "seed:load", targetType: "database", targetId: "local", category: "member", detail: "Initial demo seed loaded." },
];

export const seedSharedDevTokens: InferInsertModel<typeof sharedDevTokens>[] = [
	{ tokenHash: "shared-dev-admin-token-hash", memberId: "mem_demo_admin", label: "Shared admin token" },
	{ tokenHash: "shared-dev-member-token-hash", memberId: "mem_demo_member", label: "Shared member token" },
];
