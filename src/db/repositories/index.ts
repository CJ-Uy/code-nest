import { createAuditRepository, createUnavailableAuditRepository } from "./audit";
import { createCalendarRepository } from "./calendar";
import { createEventsRepository } from "./events";
import { createLinksRepository } from "./links";
import { createMembersRepository } from "./members";
import { createNotificationsRepository } from "./notifications";
import { createRetentionRepository } from "./retention";
import { createSessionsRepository } from "./sessions";
import { createSurveysRepository } from "./surveys";
import type { MemberDb } from "./members";
import type { AuditDb } from "./audit";
import type { DatabaseAdapter } from "../types";

export function createDrizzleRepositories(db: MemberDb & AuditDb) {
	const audit = createAuditRepository(db);
	return {
		members: createMembersRepository(db, audit),
		sessions: createSessionsRepository(),
		links: createLinksRepository(),
		events: createEventsRepository(),
		retention: createRetentionRepository(),
		surveys: createSurveysRepository(),
		notifications: createNotificationsRepository(),
		calendar: createCalendarRepository(),
		audit,
	};
}

export type Repositories = ReturnType<typeof createDrizzleRepositories>;

export function createSharedRepositories(adapter: DatabaseAdapter): Repositories {
	const audit = createUnavailableAuditRepository();
	return {
		members: {
			list: async (_actor, input) => adapter.listMembers().then((members) => members.slice(0, input?.limit ?? 25)),
			getById: async (_actor, id) => adapter.getMemberById(id),
			create: async (_actor, input) => adapter.createMember(input),
			updateProfile: async (_actor, id, input) => adapter.updateMemberProfile(id, input),
		},
		sessions: createSessionsRepository(),
		links: createLinksRepository(),
		events: createEventsRepository(),
		retention: createRetentionRepository(),
		surveys: createSurveysRepository(),
		notifications: createNotificationsRepository(),
		calendar: createCalendarRepository(),
		audit,
	};
}
