import { and, desc, eq, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { members, retentionRecords, terms } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { CreateManualRetentionRecordInput } from "../types";
import type { AuditRepository } from "./audit";

export type RetentionRecord = InferSelectModel<typeof retentionRecords>;

export type RecordEventAttendanceInput = {
	memberId: string;
	termId: string;
	eventId: string;
	points: number | null;
	reason: string;
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
export type LeaderboardRow = { memberId: string; fullName: string | null; name: string | null; totalPoints: number };

export type RetentionRepository = {
	recordEventAttendance(actor: Actor, input: RecordEventAttendanceInput): Promise<RetentionRecord>;
	listForMember(actor: Actor, input: ListForMemberInput): Promise<RetentionRecord[]>;
	getMemberTermSummary(actor: Actor, input: MemberTermSummaryInput): Promise<RetentionSummary>;
	leaderboard(actor: Actor, input: LeaderboardInput): Promise<LeaderboardRow[]>;
	createManual(actor: Actor, input: CreateManualRetentionRecordInput): Promise<{ recordIds: string[] }>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

function statusFor(totalPoints: number, retainedAt: number, probationBelow: number): RetentionStatus {
	if (totalPoints >= retainedAt) return "retained";
	if (totalPoints < probationBelow) return "probation";
	return "on_track";
}

export function createRetentionRepository(db: Db, audit: AuditRepository): RetentionRepository {
	return {
		async recordEventAttendance(actor, input) {
			if (!can(actor, "points:assign")) {
				throw new Error("Not authorized to record retention points.");
			}
			const [record] = await db
				.insert(retentionRecords)
				.values({
					id: createId("ret"),
					memberId: input.memberId,
					termId: input.termId,
					eventId: input.eventId,
					points: input.points,
					reason: input.reason,
					source: "event_attendance",
					recordedBy: actor.memberId,
				})
				.returning();
			await audit.record(actor, {
				action: "retention:record_attendance",
				targetType: "member",
				targetId: input.memberId,
				category: "retention",
				detail: input.eventId ? `event=${input.eventId}` : null,
			});
			return record;
		},

		async listForMember(actor, input) {
			if (actor.memberId !== input.memberId && !can(actor, "retention:record")) {
				throw new Error("Not authorized to read these retention records.");
			}
			return db
				.select()
				.from(retentionRecords)
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
				.where(and(eq(retentionRecords.memberId, input.memberId), eq(retentionRecords.termId, input.termId)));
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
				.where(eq(retentionRecords.termId, input.termId))
				.groupBy(retentionRecords.memberId, members.fullName, members.name)
				.orderBy(desc(sql`coalesce(sum(${retentionRecords.points}), 0)`))
				.limit(Math.min(input.limit ?? 50, 100))
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

			const recordedAt = new Date();
			const rows = input.memberIds.map((memberId) => ({
				id: createId("ret"),
				memberId,
				termId: input.termId,
				eventId: input.eventId,
				points: input.points,
				reason: input.reason,
				source: "manual" as const,
				recordedBy: actor.memberId,
				recordedAt,
			}));

			const inserts = rows.map((row) => db.insert(retentionRecords).values(row));
			await db.batch(inserts);

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
	};
}
