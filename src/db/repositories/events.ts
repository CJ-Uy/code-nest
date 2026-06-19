import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { crsAttendance, crsEvents, eventRsvps, members } from "@/db/schema";
import type { EventType, RsvpState } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { AuditRepository } from "./audit";
import type { RetentionRepository } from "./retention";

export type EventRecord = InferSelectModel<typeof crsEvents>;

export type CreateEventInput = {
	title: string;
	type: EventType;
	place: string;
	description: string;
	startsAt: Date;
	endsAt: Date | null;
	points: number | null;
	capacity: number | null;
};

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

export type EventsRepository = {
	create(actor: Actor, input: CreateEventInput): Promise<EventRecord>;
	listApproved(actor: Actor, input?: ListEventsInput): Promise<EventRecord[]>;
	listPending(actor: Actor, input?: ListEventsInput): Promise<EventRecord[]>;
	getById(actor: Actor, id: string): Promise<EventRecord | null>;
	approve(actor: Actor, eventId: string): Promise<EventRecord>;
	reject(actor: Actor, eventId: string): Promise<EventRecord>;
	setRsvp(actor: Actor, input: SetRsvpInput): Promise<{ state: RsvpState }>;
	recordScan(actor: Actor, input: RecordScanInput): Promise<RecordScanResult>;
	searchAttendableMembers(actor: Actor, input: MemberSearchInput): Promise<AttendableMember[]>;
	listAttendance(actor: Actor, eventId: string): Promise<AttendanceRow[]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

async function loadEvent(db: Db, eventId: string): Promise<EventRecord | null> {
	const [event] = await db.select().from(crsEvents).where(eq(crsEvents.id, eventId)).limit(1);
	return event ?? null;
}

export function createEventsRepository(db: Db, audit: AuditRepository, retention: RetentionRepository): EventsRepository {
	return {
		async create(actor, input) {
			if (!can(actor, "event:approve")) {
				throw new Error("Not authorized to create events.");
			}
			const [event] = await db
				.insert(crsEvents)
				.values({
					id: createId("evt"),
					title: input.title,
					type: input.type,
					status: "pending",
					points: input.points,
					place: input.place,
					capacity: input.capacity,
					startsAt: input.startsAt,
					endsAt: input.endsAt,
					description: input.description,
					createdBy: actor.memberId,
					// checkin_secret is vestigial under the v5 QR flip. Keep insert value only.
					checkinSecret: "",
				})
				.returning();
			await audit.record(actor, { action: "event:create", targetType: "event", targetId: event.id, category: "event" });
			return event;
		},

		async listApproved(actor, input) {
			if (!actor) throw new Error("Authentication required.");
			return db
				.select()
				.from(crsEvents)
				.where(eq(crsEvents.status, "approved"))
				.orderBy(asc(crsEvents.startsAt))
				.limit(Math.min(input?.limit ?? 50, 100))
				.offset(input?.offset ?? 0);
		},

		async listPending(actor, input) {
			if (!can(actor, "event:approve")) {
				throw new Error("Not authorized to view pending events.");
			}
			return db
				.select()
				.from(crsEvents)
				.where(eq(crsEvents.status, "pending"))
				.orderBy(asc(crsEvents.startsAt))
				.limit(Math.min(input?.limit ?? 50, 100))
				.offset(input?.offset ?? 0);
		},

		async getById(actor, id) {
			const event = await loadEvent(db, id);
			if (!event) return null;
			if (event.status !== "approved" && !can(actor, "event:approve")) return null;
			return event;
		},

		async approve(actor, eventId) {
			if (!can(actor, "event:approve")) {
				throw new Error("Not authorized to approve events.");
			}
			const [event] = await db
				.update(crsEvents)
				.set({ status: "approved", approvedBy: actor.memberId, approvedAt: new Date() })
				.where(eq(crsEvents.id, eventId))
				.returning();
			if (!event) throw new Error("Event not found.");
			await audit.record(actor, { action: "event:approve", targetType: "event", targetId: eventId, category: "event" });
			return event;
		},

		async reject(actor, eventId) {
			if (!can(actor, "event:approve")) {
				throw new Error("Not authorized to reject events.");
			}
			const [event] = await db
				.update(crsEvents)
				.set({ status: "rejected", approvedBy: actor.memberId, approvedAt: new Date() })
				.where(eq(crsEvents.id, eventId))
				.returning();
			if (!event) throw new Error("Event not found.");
			await audit.record(actor, { action: "event:reject", targetType: "event", targetId: eventId, category: "event" });
			return event;
		},

		async setRsvp(actor, input) {
			const event = await loadEvent(db, input.eventId);
			if (!event || event.status !== "approved") throw new Error("Event not found.");
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
			if (!can(actor, "points:assign")) {
				throw new Error("Not authorized to scan attendance.");
			}
			const event = await loadEvent(db, input.eventId);
			if (!event || event.status !== "approved") throw new Error("Event not found.");

			const [existing] = await db
				.select({ memberId: crsAttendance.memberId })
				.from(crsAttendance)
				.where(and(eq(crsAttendance.eventId, input.eventId), eq(crsAttendance.memberId, input.memberId)))
				.limit(1);
			const scannedAt = new Date();
			if (existing) {
				return { eventId: input.eventId, memberId: input.memberId, scannedAt, alreadyPresent: true };
			}

			await db
				.insert(crsAttendance)
				.values({ eventId: input.eventId, memberId: input.memberId, scannedAt, scannedBy: actor.memberId });
			await retention.recordEventAttendance(actor, {
				memberId: input.memberId,
				termId: input.termId,
				eventId: input.eventId,
				points: event.points,
				reason: `Attended ${event.title}`,
			});
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
			if (!can(actor, "points:assign")) {
				throw new Error("Not authorized to search members for attendance.");
			}
			const term = `%${input.query.trim().toLowerCase()}%`;
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
					or(
						like(sql`lower(${members.email})`, term),
						like(sql`lower(${members.fullName})`, term),
						like(sql`lower(${members.name})`, term),
					),
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
			if (!can(actor, "points:assign")) {
				throw new Error("Not authorized to view attendance.");
			}
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
