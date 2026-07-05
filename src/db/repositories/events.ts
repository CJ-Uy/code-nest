import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { crsAttendance, crsEvents, eventInvites, eventRsvps, eventStaff, members, retentionRecords } from "@/db/schema";
import type { EventType, RsvpState } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { AuditRepository } from "./audit";
import { notify } from "./notifications";

export const CHECKIN_LEAD_MS = 30 * 60 * 1000;

export type EventRole = "owner" | "admin" | "scanner";
export type EventRecord = InferSelectModel<typeof crsEvents> & {
	myRole: EventRole | null;
	canModerate: boolean;
	canSetPoints: boolean;
};

export type CreateEventInput = {
	title: string;
	type: EventType;
	place: string;
	description: string;
	startsAt: Date;
	endsAt: Date;
	points?: number | null;
	capacity: number | null;
};

export type UpdateEventInput = Partial<{
	title: string;
	type: EventType;
	place: string;
	description: string;
	startsAt: Date;
	endsAt: Date;
	capacity: number | null;
}>;

export type ListEventsInput = { limit?: number; offset?: number };
export type SetRsvpInput = { eventId: string; state: RsvpState };
export type RecordScanInput = { eventId: string; memberId: string; termId: string };
export type RecordScanResult = { eventId: string; memberId: string; scannedAt: Date; alreadyPresent: boolean };
export type MemberSearchInput = { eventId: string; query: string; limit?: number };
export type AttendableMember = {
	memberId: string;
	fullName: string | null;
	name: string | null;
	email: string;
	alreadyScanned: boolean;
};
export type AttendanceRow = {
	memberId: string;
	fullName: string | null;
	name: string | null;
	scannedAt: Date;
	scannedBy: string;
};
export type EventInviteRow = { memberId: string; fullName: string | null; invitedAt: Date };

export type EventsRepository = {
	resolveCapability(actor: Actor, event: { createdBy: string; id: string }): Promise<EventRole | null>;
	create(actor: Actor, input: CreateEventInput): Promise<EventRecord>;
	listPublished(actor: Actor, input?: ListEventsInput): Promise<EventRecord[]>;
	listPending(actor: Actor, input?: ListEventsInput): Promise<EventRecord[]>;
	getById(actor: Actor, id: string): Promise<EventRecord | null>;
	update(actor: Actor, eventId: string, patch: UpdateEventInput): Promise<EventRecord>;
	softDelete(actor: Actor, eventId: string): Promise<void>;
	setPoints(actor: Actor, eventId: string, points: number | null): Promise<{ updated: number }>;
	addStaff(actor: Actor, eventId: string, memberId: string, role: "admin" | "scanner"): Promise<void>;
	removeStaff(actor: Actor, eventId: string, memberId: string): Promise<void>;
	transferOwnership(actor: Actor, eventId: string, toMemberId: string): Promise<void>;
	invite(actor: Actor, eventId: string, memberIds: string[]): Promise<{ invited: number }>;
	listInvites(actor: Actor, eventId: string): Promise<EventInviteRow[]>;
	listStaff(
		actor: Actor,
		eventId: string,
	): Promise<Array<{ memberId: string; fullName: string | null; name: string | null; role: "owner" | "admin" | "scanner" }>>;
	setRsvp(actor: Actor, input: SetRsvpInput): Promise<{ state: RsvpState }>;
	recordScan(actor: Actor, input: RecordScanInput): Promise<RecordScanResult>;
	searchAttendableMembers(actor: Actor, input: MemberSearchInput): Promise<AttendableMember[]>;
	listAttendance(actor: Actor, eventId: string): Promise<AttendanceRow[]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;
type BaseEventRecord = InferSelectModel<typeof crsEvents>;

async function loadEvent(db: Db, eventId: string): Promise<BaseEventRecord | null> {
	const [event] = await db.select().from(crsEvents).where(eq(crsEvents.id, eventId)).limit(1);
	if (!event || event.deletedAt) return null;
	return event;
}

async function staffRole(db: Db, eventId: string, memberId: string): Promise<"admin" | "scanner" | null> {
	const [row] = await db
		.select({ role: eventStaff.role })
		.from(eventStaff)
		.where(and(eq(eventStaff.eventId, eventId), eq(eventStaff.memberId, memberId)))
		.limit(1);
	return row?.role ?? null;
}

function withCapabilities(actor: Actor, event: BaseEventRecord, role: EventRole | null): EventRecord {
	return {
		...event,
		myRole: role,
		canModerate: can(actor, "event:moderate"),
		canSetPoints: can(actor, "event:points"),
	};
}

function canManage(role: EventRole | null, actor: Actor): boolean {
	return role === "owner" || role === "admin" || can(actor, "event:moderate");
}

function canOperate(role: EventRole | null, actor: Actor): boolean {
	return role !== null || can(actor, "event:moderate");
}

function inCheckinWindow(event: BaseEventRecord, now: Date): boolean {
	if (!event.endsAt) return false;
	return now.getTime() >= event.startsAt.getTime() - CHECKIN_LEAD_MS && now.getTime() <= event.endsAt.getTime();
}

async function runAtomic(db: Db, queries: unknown[]): Promise<void> {
	if (db.batch) {
		await db.batch(queries);
		return;
	}
	for (const query of queries) {
		await query;
	}
}

export function createEventsRepository(db: Db, audit: AuditRepository): EventsRepository {
	async function resolveCapability(actor: Actor, event: { createdBy: string; id: string }): Promise<EventRole | null> {
		if (event.createdBy === actor.memberId) return "owner";
		return staffRole(db, event.id, actor.memberId);
	}

	async function decorate(actor: Actor, event: BaseEventRecord): Promise<EventRecord> {
		return withCapabilities(actor, event, await resolveCapability(actor, event));
	}

	async function requireEvent(actor: Actor, eventId: string) {
		const event = await loadEvent(db, eventId);
		if (!event) throw new Error("Event not found.");
		return { event, role: await resolveCapability(actor, event) };
	}

	return {
		resolveCapability,

		async create(actor, input) {
			const [event] = await db
				.insert(crsEvents)
				.values({
					id: createId("evt"),
					title: input.title,
					type: input.type,
					status: "approved",
					points: null,
					place: input.place,
					capacity: input.capacity,
					startsAt: input.startsAt,
					endsAt: input.endsAt,
					description: input.description,
					createdBy: actor.memberId,
					approvedBy: actor.memberId,
					approvedAt: new Date(),
					checkinSecret: "",
				})
				.returning();
			await audit.record(actor, { action: "event:create", targetType: "event", targetId: event.id, category: "event" });
			return decorate(actor, event);
		},

		async listPublished(actor, input) {
			if (!actor) throw new Error("Authentication required.");
			const rows: BaseEventRecord[] = await db
				.select()
				.from(crsEvents)
				.where(isNull(crsEvents.deletedAt))
				.orderBy(asc(crsEvents.startsAt))
				.limit(Math.min(input?.limit ?? 50, 100))
				.offset(input?.offset ?? 0);
			return Promise.all(rows.map((event) => decorate(actor, event)));
		},

		async listPending(actor, input) {
			if (!can(actor, "event:moderate")) {
				throw new Error("Not authorized to view pending events.");
			}
			const rows: BaseEventRecord[] = await db
				.select()
				.from(crsEvents)
				.where(and(eq(crsEvents.status, "pending"), isNull(crsEvents.deletedAt)))
				.orderBy(asc(crsEvents.startsAt))
				.limit(Math.min(input?.limit ?? 50, 100))
				.offset(input?.offset ?? 0);
			return Promise.all(rows.map((event) => decorate(actor, event)));
		},

		async getById(actor, id) {
			const event = await loadEvent(db, id);
			return event ? decorate(actor, event) : null;
		},

		async update(actor, eventId, patch) {
			const { event, role } = await requireEvent(actor, eventId);
			if (!canManage(role, actor)) throw new Error("Not authorized to update this event.");
			const [updated] = await db
				.update(crsEvents)
				.set({
					title: patch.title ?? event.title,
					type: patch.type ?? event.type,
					place: patch.place ?? event.place,
					description: patch.description ?? event.description,
					startsAt: patch.startsAt ?? event.startsAt,
					endsAt: patch.endsAt ?? event.endsAt,
					capacity: patch.capacity === undefined ? event.capacity : patch.capacity,
				})
				.where(eq(crsEvents.id, eventId))
				.returning();
			await audit.record(actor, { action: "event:update", targetType: "event", targetId: eventId, category: "event" });
			return decorate(actor, updated);
		},

		async softDelete(actor, eventId) {
			const { event, role } = await requireEvent(actor, eventId);
			if (role !== "owner" && !can(actor, "event:moderate")) throw new Error("Not authorized to delete this event.");
			await db.update(crsEvents).set({ deletedAt: new Date() }).where(eq(crsEvents.id, event.id));
			await audit.record(actor, { action: "event:delete", targetType: "event", targetId: eventId, category: "event" });
		},

		async setPoints(actor, eventId, points) {
			if (!can(actor, "event:points")) throw new Error("Not authorized to set event points.");
			const event = await loadEvent(db, eventId);
			if (!event) throw new Error("Event not found.");
			const attendees = await db
				.select({ memberId: crsAttendance.memberId })
				.from(crsAttendance)
				.where(eq(crsAttendance.eventId, eventId));
			await runAtomic(db, [
				db.update(crsEvents).set({ points }).where(eq(crsEvents.id, eventId)),
				db
					.update(retentionRecords)
					.set({ points })
					.where(and(eq(retentionRecords.eventId, eventId), eq(retentionRecords.source, "event_attendance"))),
			]);
			if (points !== null) {
				for (const attendee of attendees) {
					await notify(db, {
						memberId: attendee.memberId,
						kind: "points_awarded",
						title: "Points updated",
						body: `${event.title} is now worth ${points} points.`,
						href: `/portal/calendar/${eventId}`,
					});
				}
			}
			await audit.record(actor, { action: "event:set_points", targetType: "event", targetId: eventId, category: "event" });
			return { updated: attendees.length };
		},

		async addStaff(actor, eventId, memberId, role) {
			const { event, role: actorRole } = await requireEvent(actor, eventId);
			if (actorRole !== "owner" && actorRole !== "admin") throw new Error("Not authorized to manage event staff.");
			if (memberId === event.createdBy) throw new Error("Owner cannot be event staff.");
			await db
				.insert(eventStaff)
				.values({ eventId, memberId, role, addedBy: actor.memberId })
				.onConflictDoUpdate({ target: [eventStaff.eventId, eventStaff.memberId], set: { role, addedBy: actor.memberId, addedAt: new Date() } });
			await audit.record(actor, { action: "event:add_staff", targetType: "event", targetId: eventId, category: "event", detail: memberId });
		},

		async removeStaff(actor, eventId, memberId) {
			const { event, role } = await requireEvent(actor, eventId);
			if (role !== "owner" && role !== "admin") throw new Error("Not authorized to manage event staff.");
			if (memberId === event.createdBy) throw new Error("Owner cannot be removed as staff.");
			await db.delete(eventStaff).where(and(eq(eventStaff.eventId, eventId), eq(eventStaff.memberId, memberId)));
			await audit.record(actor, { action: "event:remove_staff", targetType: "event", targetId: eventId, category: "event", detail: memberId });
		},

		async transferOwnership(actor, eventId, toMemberId) {
			const { event, role } = await requireEvent(actor, eventId);
			if (role !== "owner") throw new Error("Not authorized to transfer this event.");
			if (toMemberId === actor.memberId) return;
			await runAtomic(db, [
				db.update(crsEvents).set({ createdBy: toMemberId }).where(eq(crsEvents.id, eventId)),
				db.delete(eventStaff).where(and(eq(eventStaff.eventId, eventId), eq(eventStaff.memberId, toMemberId))),
				db
					.insert(eventStaff)
					.values({ eventId, memberId: event.createdBy, role: "admin", addedBy: actor.memberId })
					.onConflictDoUpdate({
						target: [eventStaff.eventId, eventStaff.memberId],
						set: { role: "admin", addedBy: actor.memberId, addedAt: new Date() },
					}),
			]);
			await audit.record(actor, { action: "event:transfer", targetType: "event", targetId: eventId, category: "event", detail: toMemberId });
		},

		async invite(actor, eventId, memberIds) {
			const { event, role } = await requireEvent(actor, eventId);
			if (role !== "owner" && role !== "admin") throw new Error("Not authorized to invite members.");
			let invited = 0;
			for (const memberId of [...new Set(memberIds)]) {
				const rows = await db
					.insert(eventInvites)
					.values({ eventId, memberId, invitedBy: actor.memberId })
					.onConflictDoNothing()
					.returning({ memberId: eventInvites.memberId });
				if (rows.length === 0) continue;
				invited += 1;
				await notify(db, {
					memberId,
					kind: "event_invite",
					title: "Event invitation",
					body: `You were invited to ${event.title}.`,
					href: `/portal/calendar/${eventId}`,
				});
			}
			await audit.record(actor, { action: "event:invite", targetType: "event", targetId: eventId, category: "event", detail: String(invited) });
			return { invited };
		},

		async listInvites(actor, eventId) {
			const { role } = await requireEvent(actor, eventId);
			if (role !== "owner" && role !== "admin") throw new Error("Not authorized to list event invites.");
			return db
				.select({ memberId: eventInvites.memberId, fullName: members.fullName, invitedAt: eventInvites.invitedAt })
				.from(eventInvites)
				.innerJoin(members, eq(members.id, eventInvites.memberId))
				.where(eq(eventInvites.eventId, eventId))
				.orderBy(asc(members.fullName));
		},

		async listStaff(actor, eventId) {
			const { event } = await requireEvent(actor, eventId);
			const [owner] = await db
				.select({ memberId: members.id, fullName: members.fullName, name: members.name })
				.from(members)
				.where(eq(members.id, event.createdBy))
				.limit(1);
			const staff = await db
				.select({ memberId: eventStaff.memberId, fullName: members.fullName, name: members.name, role: eventStaff.role })
				.from(eventStaff)
				.innerJoin(members, eq(members.id, eventStaff.memberId))
				.where(eq(eventStaff.eventId, eventId))
				.orderBy(asc(eventStaff.addedAt), asc(members.fullName));
			return owner ? [{ ...owner, role: "owner" as const }, ...staff] : staff;
		},

		async setRsvp(actor, input) {
			const event = await loadEvent(db, input.eventId);
			if (!event) throw new Error("Event not found.");
			await db
				.insert(eventRsvps)
				.values({ eventId: input.eventId, memberId: actor.memberId, state: input.state, updatedAt: new Date() })
				.onConflictDoUpdate({
					target: [eventRsvps.eventId, eventRsvps.memberId],
					set: { state: input.state, updatedAt: new Date() },
				});
			return { state: input.state };
		},

		async recordScan(actor, input) {
			const { event, role } = await requireEvent(actor, input.eventId);
			if (!canOperate(role, actor)) throw new Error("Not authorized to scan attendance.");
			if (role === "scanner" && !inCheckinWindow(event, new Date())) throw new Error("Check-in is closed.");

			const [existing] = await db
				.select({ memberId: crsAttendance.memberId })
				.from(crsAttendance)
				.where(and(eq(crsAttendance.eventId, input.eventId), eq(crsAttendance.memberId, input.memberId)))
				.limit(1);
			const scannedAt = new Date();
			if (existing) {
				return { eventId: input.eventId, memberId: input.memberId, scannedAt, alreadyPresent: true };
			}

			try {
				await runAtomic(db, [
					db
						.insert(crsAttendance)
						.values({ eventId: input.eventId, memberId: input.memberId, scannedAt, scannedBy: actor.memberId }),
					db.insert(retentionRecords).values({
						id: createId("ret"),
						memberId: input.memberId,
						termId: input.termId,
						eventId: input.eventId,
						points: event.points,
						reason: `Attended ${event.title}`,
						source: "event_attendance",
						recordedBy: actor.memberId,
						recordedAt: scannedAt,
					}),
				]);
			} catch {
				return { eventId: input.eventId, memberId: input.memberId, scannedAt, alreadyPresent: true };
			}
			await audit.record(actor, {
				action: "event:scan_attendance",
				targetType: "event",
				targetId: input.eventId,
				category: "event",
				detail: `member=${input.memberId}`,
			});
			return { eventId: input.eventId, memberId: input.memberId, scannedAt, alreadyPresent: false };
		},

		async searchAttendableMembers(actor, input) {
			const { role } = await requireEvent(actor, input.eventId);
			if (!canOperate(role, actor)) throw new Error("Not authorized to search members for attendance.");
			const query = input.query.trim();
			const broad = role === "owner" || role === "admin" || can(actor, "event:moderate");
			const term = `%${query.toLowerCase()}%`;
			const rows = await db
				.select({
					memberId: members.id,
					fullName: members.fullName,
					name: members.name,
					email: members.email,
					scannedMemberId: crsAttendance.memberId,
				})
				.from(members)
				.leftJoin(
					crsAttendance,
					and(eq(crsAttendance.memberId, members.id), eq(crsAttendance.eventId, input.eventId)),
				)
				.where(
					broad
						? or(
								like(sql`lower(${members.id})`, term),
								like(sql`lower(${members.email})`, term),
								like(sql`lower(${members.fullName})`, term),
								like(sql`lower(${members.name})`, term),
							)
						: eq(members.id, query),
				)
				.orderBy(asc(members.fullName))
				.limit(Math.min(input.limit ?? 20, 50));
			return rows.map(
				(row: {
					memberId: string;
					fullName: string | null;
					name: string | null;
					email: string;
					scannedMemberId: string | null;
				}) => ({
					memberId: row.memberId,
					fullName: row.fullName,
					name: row.name,
					email: row.email,
					alreadyScanned: row.scannedMemberId !== null,
				}),
			);
		},

		async listAttendance(actor, eventId) {
			const { role } = await requireEvent(actor, eventId);
			if (!canOperate(role, actor)) throw new Error("Not authorized to view attendance.");
			return db
				.select({
					memberId: crsAttendance.memberId,
					fullName: members.fullName,
					name: members.name,
					scannedAt: crsAttendance.scannedAt,
					scannedBy: crsAttendance.scannedBy,
				})
				.from(crsAttendance)
				.innerJoin(members, eq(members.id, crsAttendance.memberId))
				.where(eq(crsAttendance.eventId, eventId))
				.orderBy(desc(crsAttendance.scannedAt));
		},
	};
}
