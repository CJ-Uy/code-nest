import { createAuditRepository, createUnavailableAuditRepository } from "./audit";
import { createCalendarRepository } from "./calendar";
import { createEventForumRepository } from "./event-forum";
import { createEventMediaRepository } from "./event-media";
import { createEventsRepository } from "./events";
import { createLinksRepository, createUnavailableLinksRepository, type LinkDb } from "./links";
import { createMembersRepository } from "./members";
import { createNotificationsRepository, type NotificationsRepository } from "./notifications";
import { createOverviewRepository, type OverviewRepository } from "./overview";
import { createRetentionRepository } from "./retention";
import { createSessionsRepository } from "./sessions";
import { createSurveysRepository } from "./surveys";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { MemberDb } from "./members";
import type { AuditDb } from "./audit";
import type { getDb } from "../client";
import type * as schema from "../schema";
import type { DatabaseAdapter } from "../types";

type DrizzleDb = ReturnType<typeof getDb>;

export function createDrizzleRepositories(db: DrizzleDb) {
	const audit = createAuditRepository(db);
	// getDb() is typed as the union of the sync better-sqlite3 and async D1
	// Drizzle clients. The notifications/overview repos type their handle as the
	// async D1 client (what production and the tests run on); narrow once here,
	// mirroring the existing members cast. The local handle stays compatible at
	// runtime.
	const d1 = db as unknown as DrizzleD1Database<typeof schema>;
	const retention = createRetentionRepository(db, audit);
	return {
		members: createMembersRepository(db as unknown as MemberDb & AuditDb, audit),
		sessions: createSessionsRepository(),
		links: createLinksRepository(db as unknown as LinkDb, audit),
		events: createEventsRepository(db, audit, retention),
		eventMedia: createEventMediaRepository(db, audit),
		eventForum: createEventForumRepository(db, audit),
		retention,
		surveys: createSurveysRepository(),
		notifications: createNotificationsRepository(d1),
		overview: createOverviewRepository(d1),
		calendar: createCalendarRepository(),
		audit,
	};
}

export type Repositories = ReturnType<typeof createDrizzleRepositories>;

function createUnavailableNotificationsRepository(): NotificationsRepository {
	const unavailable = () => {
		throw new Error("Notifications are unavailable through this repository adapter.");
	};
	return {
		listFeed: unavailable,
		unreadCount: unavailable,
		markRead: unavailable,
		markAllRead: unavailable,
	};
}

function createUnavailableOverviewRepository(): OverviewRepository {
	return {
		getSummary() {
			throw new Error("Overview is unavailable through this repository adapter.");
		},
	};
}

export function createSharedRepositories(adapter: DatabaseAdapter): Repositories {
	const audit = createUnavailableAuditRepository();
	const unavailable = () => {
		throw new Error("This operation is only available through the shared /internal API.");
	};
	return {
		members: {
			list: async (_actor, input) => adapter.listMembers().then((members) => members.slice(0, input?.limit ?? 25)),
			getById: async (_actor, id) => adapter.getMemberById(id),
			create: async (_actor, input) => adapter.createMember(input),
			updateProfile: async (_actor, id, input) => adapter.updateMemberProfile(id, input),
		},
		sessions: createSessionsRepository(),
		links: createUnavailableLinksRepository(),
		events: new Proxy({}, { get: () => unavailable }) as ReturnType<typeof createEventsRepository>,
		eventMedia: new Proxy({}, { get: () => unavailable }) as ReturnType<typeof createEventMediaRepository>,
		eventForum: new Proxy({}, { get: () => unavailable }) as ReturnType<typeof createEventForumRepository>,
		retention: new Proxy({}, { get: () => unavailable }) as ReturnType<typeof createRetentionRepository>,
		surveys: createSurveysRepository(),
		notifications: createUnavailableNotificationsRepository(),
		overview: createUnavailableOverviewRepository(),
		calendar: createCalendarRepository(),
		audit,
	};
}
