import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { createAuditRepository } from "./audit";
import { createRetentionRepository } from "./retention";

const retentionAdmin: Actor = { memberId: "mem_admin", roles: ["retention"] };
const plainMember: Actor = { memberId: "mem_a", roles: ["member"] };

const TERM_START = new Date("2026-06-01T00:00:00.000Z");
const TERM_END = new Date("2026-10-31T00:00:00.000Z");

function makeRepo() {
	const db = drizzle(env.DB, { schema });
	return { db, repo: createRetentionRepository(db, createAuditRepository(db)) };
}

describe("retention repository on D1", () => {
	beforeEach(async () => {
		await env.DB.prepare("DELETE FROM retention_records").run();
		await env.DB.prepare("DELETE FROM crs_events").run();
		await env.DB.prepare("DELETE FROM terms").run();
		await env.DB.prepare("DELETE FROM members").run();
		await env.DB.prepare("INSERT INTO members (id, email, name, full_name) VALUES (?, ?, ?, ?)")
			.bind("mem_a", "a@example.com", "A", "Member A")
			.run();
		await env.DB.prepare("INSERT INTO members (id, email, name, full_name) VALUES (?, ?, ?, ?)")
			.bind("mem_b", "b@example.com", "B", "Member B")
			.run();
		await env.DB.prepare("INSERT INTO members (id, email, name) VALUES (?, ?, ?)")
			.bind("mem_admin", "admin@example.com", "Admin")
			.run();
		await env.DB.prepare(
			"INSERT INTO terms (id, name, retained_at, probation_below, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind("term_1", "Term 1", 20, 10, TERM_START.getTime(), TERM_END.getTime())
			.run();
	});

	it("records an event-attendance retention row and audits it", async () => {
		const { db, repo } = makeRepo();
		const created = await repo.recordEventAttendance(retentionAdmin, {
			memberId: "mem_a",
			termId: "term_1",
			eventId: null as unknown as string,
			points: 5,
			reason: "Attended Practice Night",
		});
		expect(created.source).toBe("event_attendance");
		expect(created.points).toBe(5);
		const [audit] = await db.select().from(schema.auditLogs);
		expect(audit).toMatchObject({
			action: "retention:record_attendance",
			category: "retention",
			targetId: "mem_a",
		});
	});

	it("denies a plain member from recording attendance", async () => {
		const { repo } = makeRepo();
		await expect(
			repo.recordEventAttendance(plainMember, {
				memberId: "mem_a",
				termId: "term_1",
				eventId: null as unknown as string,
				points: 5,
				reason: "x",
			}),
		).rejects.toThrow("Not authorized");
	});

	it("lets a member read their own term records but not another member's", async () => {
		const { repo } = makeRepo();
		await repo.recordEventAttendance(retentionAdmin, {
			memberId: "mem_a",
			termId: "term_1",
			eventId: null as unknown as string,
			points: 5,
			reason: "x",
		});
		const own = await repo.listForMember(plainMember, { memberId: "mem_a", termId: "term_1" });
		expect(own).toHaveLength(1);
		await expect(repo.listForMember(plainMember, { memberId: "mem_b", termId: "term_1" })).rejects.toThrow(
			"Not authorized",
		);
	});

	it("derives a per-term summary with status from the term thresholds", async () => {
		const { repo } = makeRepo();
		await repo.recordEventAttendance(retentionAdmin, {
			memberId: "mem_a",
			termId: "term_1",
			eventId: null as unknown as string,
			points: 12,
			reason: "x",
		});
		await repo.recordEventAttendance(retentionAdmin, {
			memberId: "mem_a",
			termId: "term_1",
			eventId: null as unknown as string,
			points: 12,
			reason: "y",
		});
		const summary = await repo.getMemberTermSummary(plainMember, { memberId: "mem_a", termId: "term_1" });
		expect(summary.totalPoints).toBe(24);
		expect(summary.recordCount).toBe(2);
		expect(summary.status).toBe("retained");
	});

	it("ranks members by total points for the term leaderboard", async () => {
		const { repo } = makeRepo();
		await repo.recordEventAttendance(retentionAdmin, {
			memberId: "mem_a",
			termId: "term_1",
			eventId: null as unknown as string,
			points: 5,
			reason: "x",
		});
		await repo.recordEventAttendance(retentionAdmin, {
			memberId: "mem_b",
			termId: "term_1",
			eventId: null as unknown as string,
			points: 15,
			reason: "y",
		});
		const board = await repo.leaderboard(retentionAdmin, { termId: "term_1" });
		expect(board.map((row) => row.memberId)).toEqual(["mem_b", "mem_a"]);
		expect(board[0].totalPoints).toBe(15);
	});
});
