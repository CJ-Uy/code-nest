import { createAnnouncementsRepository } from "./announcements";
import { createArticlesRepository } from "./articles";
import { createAuditRepository } from "./audit";
import { createCalendarRepository } from "./calendar";
import { createEventsRepository } from "./events";
import { createLibraryRepository } from "./library";
import { createLinksRepository, createUnavailableLinksRepository } from "./links";
import { createMembersRepository } from "./members";
import { createNotificationsRepository } from "./notifications";
import { createPointsRepository } from "./points";
import { createSessionsRepository } from "./sessions";
import { createSurveysRepository } from "./surveys";
import { createTeamsRepository } from "./teams";
import type { MemberDb } from "./members";
import type { LinkDb } from "./links";
import type { DatabaseAdapter } from "../types";

export function createDrizzleRepositories(db: MemberDb & LinkDb) {
	return {
		members: createMembersRepository(db),
		sessions: createSessionsRepository(),
		articles: createArticlesRepository(),
		library: createLibraryRepository(),
		links: createLinksRepository(db),
		events: createEventsRepository(),
		points: createPointsRepository(),
		surveys: createSurveysRepository(),
		announcements: createAnnouncementsRepository(),
		notifications: createNotificationsRepository(),
		calendar: createCalendarRepository(),
		audit: createAuditRepository(),
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
		},
		sessions: createSessionsRepository(),
		articles: createArticlesRepository(),
		library: createLibraryRepository(),
		links: createUnavailableLinksRepository(),
		events: createEventsRepository(),
		points: createPointsRepository(),
		surveys: createSurveysRepository(),
		announcements: createAnnouncementsRepository(),
		notifications: createNotificationsRepository(),
		calendar: createCalendarRepository(),
		audit: createAuditRepository(),
		teams: createTeamsRepository(),
	};
}
