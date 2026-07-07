import { createAnnouncementsRepository } from "./announcements";
import { createArticlesRepository } from "./articles";
import { createAuditRepository } from "./audit";
import { createCalendarRepository } from "./calendar";
import { createEventsRepository } from "./events";
import { createLibraryRepository } from "./library";
import { createLinksRepository, createUnavailableLinksRepository } from "./links";
import { createMembersRepository } from "./members";
import { createNotificationsRepository } from "./notifications";
import { createNavPinsRepository, createUnavailableNavPinsRepository } from "./navPins";
import { createPointsRepository } from "./points";
import { createRolesRepository, createUnavailableRolesRepository } from "./roles";
import { createSessionsRepository } from "./sessions";
import { createSurveysRepository } from "./surveys";
import { createTeamsRepository } from "./teams";
import type { MemberDb } from "./members";
import type { LinkDb } from "./links";
import type { getDb } from "../client";
import type { DatabaseAdapter } from "../types";

type DrizzleDb = ReturnType<typeof getDb>;

export function createDrizzleRepositories(db: DrizzleDb & MemberDb & LinkDb) {
	const audit = createAuditRepository();
	return {
		members: createMembersRepository(db, audit),
		sessions: createSessionsRepository(),
		articles: createArticlesRepository(),
		library: createLibraryRepository(),
		links: createLinksRepository(db),
		events: createEventsRepository(),
		points: createPointsRepository(),
		surveys: createSurveysRepository(),
		announcements: createAnnouncementsRepository(),
		notifications: createNotificationsRepository(db),
		calendar: createCalendarRepository(),
		audit,
		roles: createRolesRepository(db),
		navPins: createNavPinsRepository(db, audit),
		teams: createTeamsRepository(),
	};
}

export type Repositories = ReturnType<typeof createDrizzleRepositories>;

export function createSharedRepositories(adapter: DatabaseAdapter): Repositories {
	return {
		members: {
			list: async (_actor, input) => adapter.listMembers().then((members) => members.slice(0, input?.limit ?? 25)),
			getById: async (_actor, id) => adapter.getMemberById(id),
			create: async (_actor, input) => adapter.createMember(input),
			search: async () => [],
			updateProfile: async () => {
				throw new Error("Members are unavailable in shared mode.");
			},
			updateStatus: async () => {
				throw new Error("Members are unavailable in shared mode.");
			},
			delete: async () => {
				throw new Error("Member deletion is unavailable through this repository adapter.");
			},
		},
		sessions: createSessionsRepository(),
		articles: createArticlesRepository(),
		library: createLibraryRepository(),
		links: createUnavailableLinksRepository(),
		events: createEventsRepository(),
		points: createPointsRepository(),
		surveys: createSurveysRepository(),
		announcements: createAnnouncementsRepository(),
		notifications: {
			listFeed: async () => [],
			unreadCount: async () => 0,
			markRead: async () => {
				throw new Error("Notifications are unavailable in shared mode.");
			},
			markAllRead: async () => {
				throw new Error("Notifications are unavailable in shared mode.");
			},
		},
		calendar: createCalendarRepository(),
		audit: createAuditRepository(),
		roles: createUnavailableRolesRepository(),
		navPins: createUnavailableNavPinsRepository(),
		teams: createTeamsRepository(),
	};
}
