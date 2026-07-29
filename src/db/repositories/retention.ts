import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { crsAttendance, crsEvents, eventRsvps, members, pointTypes, retentionRecords, terms } from "@/db/schema";
import type { RetentionRecordSource } from "@/db/schema";
import { RETENTION_POINT_TYPE_ID } from "@/lib/point-types";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { CreateManualRetentionRecordInput } from "../types";
import type { AuditRepository } from "./audit";

export type RetentionRecord = InferSelectModel<typeof retentionRecords>;
export type TypedRetentionRecord = RetentionRecord & { pointTypeId: string; pointTypeLabel: string };

export type TermMasterRow = {
	recordId: string;
	memberId: string;
	memberEmail: string;
	memberName: string | null;
	eventId: string | null;
	eventTitle: string | null;
	pointTypeId: string;
	pointTypeLabel: string;
	points: number | null;
	reason: string;
	source: RetentionRecordSource;
	recordedAt: Date;
};

export type MemberHistoryRow = TermMasterRow;

export type EventRosterRow = {
	memberId: string;
	memberEmail: string;
	memberName: string | null;
	rsvped: boolean;
	attended: boolean;
	scannedAt: Date | null;
};

export type ListForMemberInput = { memberId: string; termId: string; limit?: number; offset?: number };
export type MemberTermSummaryInput = { memberId: string; termId: string };
export type RetentionStatus = "retained" | "on_track" | "probation";
export type RetentionSummary = {
	totalPoints: number;
	recordCount: number;
	retainedAt: number;
	probationBelow: number;
	status: RetentionStatus;
};
export type LeaderboardInput = { termId: string; limit?: number; offset?: number };
export type PublicLeaderboardInput = LeaderboardInput & { pointTypeId: string };
export type LeaderboardRow = { memberId: string; fullName: string | null; name: string | null; totalPoints: number };

export type MyHistorySummary = {
	termId: string;
	termName: string;
	totalPoints: number;
	retainedAt: number;
	probationBelow: number;
	status: RetentionStatus;
	recordCount: number;
};

export type TermOption = { id: string; name: string; isCurrent: boolean };

export type RetentionRepository = {
	listForMember(actor: Actor, input: ListForMemberInput): Promise<TypedRetentionRecord[]>;
	getMemberTermSummary(actor: Actor, input: MemberTermSummaryInput): Promise<RetentionSummary>;
	leaderboard(actor: Actor, input: LeaderboardInput): Promise<LeaderboardRow[]>;
	publicLeaderboard(actor: Actor, input: PublicLeaderboardInput): Promise<LeaderboardRow[]>;
	createManual(actor: Actor, input: CreateManualRetentionRecordInput): Promise<{ recordIds: string[] }>;
	listForTerm(actor: Actor, termId: string): Promise<TermMasterRow[]>;
	listMemberTermHistory(actor: Actor, memberId: string, termId: string): Promise<MemberHistoryRow[]>;
	listForEvent(actor: Actor, eventId: string): Promise<EventRosterRow[]>;
	myHistory(
		actor: Actor,
		input: { termId?: string },
		now?: Date,
	): Promise<{ summary: MyHistorySummary | null; records: TypedRetentionRecord[] }>;
	listTerms(actor: Actor, now?: Date): Promise<TermOption[]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

function statusFor(totalPoints: number, retainedAt: number, probationBelow: number): RetentionStatus {
	if (totalPoints >= retainedAt) return "retained";
	if (totalPoints < probationBelow) return "probation";
	return "on_track";
}

async function getCurrentTermId(db: Db, now: Date): Promise<string | null> {
	const [term] = await db
		.select({ id: terms.id })
		.from(terms)
		.where(and(lte(terms.startsAt, now), gte(terms.endsAt, now)))
		.orderBy(desc(terms.startsAt))
		.limit(1);
	return term?.id ?? null;
}

const reportBaseColumns = {
	recordId: retentionRecords.id,
	memberId: retentionRecords.memberId,
	memberEmail: members.email,
	memberName: members.fullName,
	eventId: retentionRecords.eventId,
	eventTitle: crsEvents.title,
	pointTypeId: retentionRecords.pointTypeId,
	pointTypeLabel: pointTypes.label,
	points: retentionRecords.points,
	reason: retentionRecords.reason,
	source: retentionRecords.source,
	recordedAt: retentionRecords.recordedAt,
};

const typedRecordColumns = {
	id: retentionRecords.id,
	memberId: retentionRecords.memberId,
	termId: retentionRecords.termId,
	eventId: retentionRecords.eventId,
	pointTypeId: retentionRecords.pointTypeId,
	pointTypeLabel: pointTypes.label,
	points: retentionRecords.points,
	reason: retentionRecords.reason,
	source: retentionRecords.source,
	recordedBy: retentionRecords.recordedBy,
	recordedAt: retentionRecords.recordedAt,
};

export function createRetentionRepository(db: Db, audit: AuditRepository): RetentionRepository {
	return {
		async listForMember(actor, input) {
			if (actor.memberId !== input.memberId && !can(actor, "retention:record")) {
				throw new Error("Not authorized to read these retention records.");
			}
			return db
				.select(typedRecordColumns)
				.from(retentionRecords)
				.innerJoin(pointTypes, eq(pointTypes.id, retentionRecords.pointTypeId))
				.where(and(eq(retentionRecords.memberId, input.memberId), eq(retentionRecords.termId, input.termId)))
				.orderBy(desc(retentionRecords.recordedAt))
				.limit(Math.min(input.limit ?? 50, 100))
				.offset(input.offset ?? 0);
		},

		async getMemberTermSummary(actor, input) {
			if (actor.memberId !== input.memberId && !can(actor, "retention:record")) {
				throw new Error("Not authorized to read this retention summary.");
			}
			const [agg] = await db
				.select({
					totalPoints: sql<number>`coalesce(sum(${retentionRecords.points}), 0)`,
					recordCount: sql<number>`count(*)`,
				})
				.from(retentionRecords)
				.innerJoin(pointTypes, eq(pointTypes.id, retentionRecords.pointTypeId))
				.where(
					and(
						eq(retentionRecords.memberId, input.memberId),
						eq(retentionRecords.termId, input.termId),
						eq(retentionRecords.pointTypeId, RETENTION_POINT_TYPE_ID),
					),
				);
			const [term] = await db
				.select({ retainedAt: terms.retainedAt, probationBelow: terms.probationBelow })
				.from(terms)
				.where(eq(terms.id, input.termId))
				.limit(1);
			const retainedAt = term?.retainedAt ?? 0;
			const probationBelow = term?.probationBelow ?? 0;
			const totalPoints = Number(agg?.totalPoints ?? 0);
			const recordCount = Number(agg?.recordCount ?? 0);
			return {
				totalPoints,
				recordCount,
				retainedAt,
				probationBelow,
				status: statusFor(totalPoints, retainedAt, probationBelow),
			};
		},

		async leaderboard(actor, input) {
			if (!can(actor, "retention:record")) {
				throw new Error("Not authorized to read the retention leaderboard.");
			}
			return db
				.select({
					memberId: retentionRecords.memberId,
					fullName: members.fullName,
					name: members.name,
					totalPoints: sql<number>`coalesce(sum(${retentionRecords.points}), 0)`,
				})
				.from(retentionRecords)
				.innerJoin(members, eq(members.id, retentionRecords.memberId))
				.innerJoin(pointTypes, eq(pointTypes.id, retentionRecords.pointTypeId))
				.where(and(eq(retentionRecords.termId, input.termId), eq(retentionRecords.pointTypeId, RETENTION_POINT_TYPE_ID)))
				.groupBy(retentionRecords.memberId, members.fullName, members.name)
				.orderBy(desc(sql`coalesce(sum(${retentionRecords.points}), 0)`))
				.limit(Math.min(input.limit ?? 50, 100))
				.offset(input.offset ?? 0);
		},

		async publicLeaderboard(_actor, input) {
			return db
				.select({
					memberId: retentionRecords.memberId,
					fullName: members.fullName,
					name: members.name,
					totalPoints: sql<number>`coalesce(sum(${retentionRecords.points}), 0)`,
				})
				.from(retentionRecords)
				.innerJoin(members, eq(members.id, retentionRecords.memberId))
				.where(and(eq(retentionRecords.termId, input.termId), eq(retentionRecords.pointTypeId, input.pointTypeId)))
				.groupBy(retentionRecords.memberId, members.fullName, members.name)
				.orderBy(desc(sql`coalesce(sum(${retentionRecords.points}), 0)`))
				.limit(Math.min(input.limit ?? 25, 100))
				.offset(input.offset ?? 0);
		},

		async createManual(actor, input) {
			if (!can(actor, "retention:record")) {
				throw new Error("Not authorized to record retention records.");
			}

			const [term] = await db.select().from(terms).where(eq(terms.id, input.termId)).limit(1);
			if (!term) {
				throw new Error("Term not found.");
			}
			const [pointType] = await db
				.select({ id: pointTypes.id })
				.from(pointTypes)
				.where(and(eq(pointTypes.id, input.pointTypeId), eq(pointTypes.active, true)))
				.limit(1);
			if (!pointType) {
				throw new Error("Point type is not active.");
			}

			const recordedAt = new Date();
			const rows = input.memberIds.map((memberId) => ({
				id: createId("ret"),
				memberId,
				termId: input.termId,
				eventId: input.eventId,
				pointTypeId: input.pointTypeId,
				points: input.points,
				reason: input.reason,
				source: "manual" as const,
				recordedBy: actor.memberId,
				recordedAt,
			}));

			// ponytail: sequential inserts keep local better-sqlite and D1 paths compatible; batch if bulk volume matters.
			for (const row of rows) {
				await db.insert(retentionRecords).values(row);
			}

			const pointsLabel = input.points === null ? "no points" : `${input.points} points`;
			for (const row of rows) {
				await audit.record(actor, {
					action: "retention:record_manual",
					targetType: "member",
					targetId: row.memberId,
					category: "retention",
					detail: `${pointsLabel}: ${input.reason}`,
				});
			}

			return { recordIds: rows.map((row) => row.id) };
		},

		async listForTerm(actor, termId) {
			if (!can(actor, "retention:record")) {
				throw new Error("Not authorized to read retention reports.");
			}
			return db
				.select(reportBaseColumns)
				.from(retentionRecords)
				.innerJoin(members, eq(members.id, retentionRecords.memberId))
				.innerJoin(pointTypes, eq(pointTypes.id, retentionRecords.pointTypeId))
				.leftJoin(crsEvents, eq(crsEvents.id, retentionRecords.eventId))
				.where(eq(retentionRecords.termId, termId))
				.orderBy(asc(retentionRecords.recordedAt)) as Promise<TermMasterRow[]>;
		},

		async listMemberTermHistory(actor, memberId, termId) {
			if (!can(actor, "retention:record")) {
				throw new Error("Not authorized to read retention reports.");
			}
			return db
				.select(reportBaseColumns)
				.from(retentionRecords)
				.innerJoin(members, eq(members.id, retentionRecords.memberId))
				.innerJoin(pointTypes, eq(pointTypes.id, retentionRecords.pointTypeId))
				.leftJoin(crsEvents, eq(crsEvents.id, retentionRecords.eventId))
				.where(and(eq(retentionRecords.memberId, memberId), eq(retentionRecords.termId, termId)))
				.orderBy(asc(retentionRecords.recordedAt)) as Promise<MemberHistoryRow[]>;
		},

		async listForEvent(actor, eventId) {
			if (!can(actor, "retention:record")) {
				throw new Error("Not authorized to read retention reports.");
			}
			const rsvps = await db
				.select({
					memberId: members.id,
					memberEmail: members.email,
					memberName: members.fullName,
				})
				.from(eventRsvps)
				.innerJoin(members, eq(members.id, eventRsvps.memberId))
				.where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.state, "going")));
			const attendance = await db
				.select({
					memberId: members.id,
					memberEmail: members.email,
					memberName: members.fullName,
					scannedAt: crsAttendance.scannedAt,
				})
				.from(crsAttendance)
				.innerJoin(members, eq(members.id, crsAttendance.memberId))
				.where(eq(crsAttendance.eventId, eventId));

			const rows = new Map<string, EventRosterRow>();
			for (const row of rsvps) {
				rows.set(row.memberId, { ...row, rsvped: true, attended: false, scannedAt: null });
			}
			for (const row of attendance) {
				rows.set(row.memberId, {
					memberId: row.memberId,
					memberEmail: row.memberEmail,
					memberName: row.memberName,
					rsvped: rows.get(row.memberId)?.rsvped ?? false,
					attended: true,
					scannedAt: row.scannedAt,
				});
			}
			return Array.from(rows.values()).sort((a, b) => a.memberEmail.localeCompare(b.memberEmail));
		},

		async myHistory(actor, input, now = new Date()) {
			const termId = input.termId ?? (await getCurrentTermId(db, now));
			if (!termId) return { summary: null, records: [] };

			const [term] = await db
				.select({ id: terms.id, name: terms.name, retainedAt: terms.retainedAt, probationBelow: terms.probationBelow })
				.from(terms)
				.where(eq(terms.id, termId))
				.limit(1);
			if (!term) return { summary: null, records: [] };

			const rows: TypedRetentionRecord[] = await db
				.select(typedRecordColumns)
				.from(retentionRecords)
				.innerJoin(pointTypes, eq(pointTypes.id, retentionRecords.pointTypeId))
				.where(and(eq(retentionRecords.memberId, actor.memberId), eq(retentionRecords.termId, termId)))
				.orderBy(desc(retentionRecords.recordedAt));

			const totalPoints = rows.reduce(
				(sum: number, row) => sum + (row.pointTypeId === RETENTION_POINT_TYPE_ID ? (row.points ?? 0) : 0),
				0,
			);
			const summary: MyHistorySummary = {
				termId: term.id,
				termName: term.name,
				totalPoints,
				retainedAt: term.retainedAt,
				probationBelow: term.probationBelow,
				status: statusFor(totalPoints, term.retainedAt, term.probationBelow),
				recordCount: rows.length,
			};
			const records: TypedRetentionRecord[] = rows.map((row) => ({
				id: row.id,
				memberId: row.memberId,
				termId: row.termId,
				eventId: row.eventId,
				pointTypeId: row.pointTypeId,
				pointTypeLabel: row.pointTypeLabel,
				points: row.points,
				reason: row.reason,
				source: row.source,
				recordedBy: row.recordedBy,
				recordedAt: row.recordedAt,
			}));
			return { summary, records };
		},

		async listTerms(actor, now = new Date()) {
			const currentTermId = await getCurrentTermId(db, now);
			const rows = await db.select({ id: terms.id, name: terms.name }).from(terms).orderBy(desc(terms.startsAt));
			return rows.map((row: { id: string; name: string }) => ({
				id: row.id,
				name: row.name,
				isCurrent: row.id === currentTermId,
			}));
		},
	};
}
