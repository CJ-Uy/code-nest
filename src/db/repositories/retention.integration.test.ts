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
		await env.DB.prepare("DELETE FROM audit_logs").run();
		await env.DB.prepare("DELETE FROM retention_records").run();
		await env.DB.prepare("DELETE FROM crs_attendance").run();
		await env.DB.prepare("DELETE FROM event_rsvps").run();
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

	it("lists term, member, and event reporting rows for retention admins", async () => {
		const { repo } = makeRepo();
		await env.DB.prepare(
			"INSERT INTO crs_events (id, title, type, status, points, place, starts_at, description, created_by, checkin_secret) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		)
			.bind("evt_report", "Practice Night", "official", "approved", 5, "SOM 111", 1000, "Practice", "mem_admin", "secret")
			.run();
		await env.DB.prepare(
			"INSERT INTO retention_records (id, member_id, term_id, event_id, points, reason, source, recorded_by, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		)
			.bind("ret_report_1", "mem_a", "term_1", "evt_report", 5, "Attended Practice Night", "event_attendance", "mem_admin", 2000)
			.run();
		await env.DB.prepare(
			"INSERT INTO retention_records (id, member_id, term_id, event_id, points, reason, source, recorded_by, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
		)
			.bind("ret_report_2", "mem_a", "term_1", null, null, "Submitted waiver", "manual", "mem_admin", 3000)
			.run();
		await env.DB.prepare("INSERT INTO event_rsvps (event_id, member_id, state) VALUES (?, ?, ?)")
			.bind("evt_report", "mem_a", "going")
			.run();
		await env.DB.prepare("INSERT INTO crs_attendance (event_id, member_id, scanned_at, scanned_by) VALUES (?, ?, ?, ?)")
			.bind("evt_report", "mem_b", 2500, "mem_admin")
			.run();

		const termRows = await repo.listForTerm(retentionAdmin, "term_1");
		expect(termRows).toHaveLength(2);
		expect(termRows[0]).toMatchObject({ recordId: "ret_report_1", eventTitle: "Practice Night", points: 5 });

		const memberRows = await repo.listMemberTermHistory(retentionAdmin, "mem_a", "term_1");
		expect(memberRows.map((row) => row.recordId)).toEqual(["ret_report_1", "ret_report_2"]);

		const eventRows = await repo.listForEvent(retentionAdmin, "evt_report");
		expect(eventRows).toEqual([
			expect.objectContaining({ memberEmail: "a@example.com", rsvped: true, attended: false }),
			expect.objectContaining({ memberEmail: "b@example.com", rsvped: false, attended: true }),
		]);
	});

	it("rejects reporting reads from actors without retention scope", async () => {
		const { repo } = makeRepo();
		await expect(repo.listForTerm(plainMember, "term_1")).rejects.toThrow("Not authorized");
		await expect(repo.listMemberTermHistory(plainMember, "mem_a", "term_1")).rejects.toThrow("Not authorized");
		await expect(repo.listForEvent(plainMember, "evt_missing")).rejects.toThrow("Not authorized");
	});

	it("records one manual entry across multiple members in a single batch", async () => {
		const { db, repo } = makeRepo();

		const result = await repo.createManual(retentionAdmin, {
			memberIds: ["mem_a", "mem_b"],
			termId: "term_1",
			eventId: null,
			points: null,
			reason: "Submitted the required medical waiver",
		});

		const rows = await db.select().from(schema.retentionRecords);
		expect(result.recordIds).toHaveLength(2);
		expect(rows).toHaveLength(2);
		expect(rows.every((row) => row.source === "manual")).toBe(true);
		expect(rows.every((row) => row.points === null)).toBe(true);
		expect(rows.every((row) => row.recordedBy === "mem_admin")).toBe(true);
		expect(rows.map((row) => row.memberId).sort()).toEqual(["mem_a", "mem_b"]);
	});

	it("stores a negative manual point value as a deduction", async () => {
		const { db, repo } = makeRepo();

		await repo.createManual(retentionAdmin, {
			memberIds: ["mem_a"],
			termId: "term_1",
			eventId: null,
			points: -5,
			reason: "Logged violation",
		});

		const [row] = await db.select().from(schema.retentionRecords);
		expect(row.points).toBe(-5);
	});

	it("writes one manual retention audit row per member", async () => {
		const { db, repo } = makeRepo();

		await repo.createManual(retentionAdmin, {
			memberIds: ["mem_a", "mem_b"],
			termId: "term_1",
			eventId: null,
			points: 3,
			reason: "Attended makeup session",
		});

		const audits = await db.select().from(schema.auditLogs);
		expect(audits).toHaveLength(2);
		expect(audits.every((row) => row.category === "retention")).toBe(true);
		expect(audits.every((row) => row.action === "retention:record_manual")).toBe(true);
	});

	it("rejects a manual entry from an actor without the retention:record permission", async () => {
		const { db, repo } = makeRepo();

		await expect(
			repo.createManual(plainMember, {
				memberIds: ["mem_a"],
				termId: "term_1",
				eventId: null,
				points: null,
				reason: "Nope",
			}),
		).rejects.toThrow("Not authorized");
		expect(await db.select().from(schema.retentionRecords)).toHaveLength(0);
	});

	it("rejects an unknown manual term and writes nothing", async () => {
		const { db, repo } = makeRepo();

		await expect(
			repo.createManual(retentionAdmin, {
				memberIds: ["mem_a"],
				termId: "term_missing",
				eventId: null,
				points: null,
				reason: "Bad term",
			}),
		).rejects.toThrow("Term not found");
		expect(await db.select().from(schema.retentionRecords)).toHaveLength(0);
	});

	describe("myHistory and listTerms", () => {
		const NOW = new Date("2026-07-01T00:00:00.000Z");

		beforeEach(async () => {
			await env.DB.prepare(
				"INSERT INTO terms (id, name, retained_at, probation_below, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?)",
			)
				.bind("term_past", "Past Term", 20, 10, Date.UTC(2025, 4, 1), Date.UTC(2025, 6, 30))
				.run();
		});

		it("summarizes the current term and excludes past-term and other members' records", async () => {
			const { repo } = makeRepo();
			await repo.recordEventAttendance(retentionAdmin, {
				memberId: "mem_a",
				termId: "term_1",
				eventId: null as unknown as string,
				points: 5,
				reason: "Attended",
			});
			await repo.createManual(retentionAdmin, {
				memberIds: ["mem_a"],
				termId: "term_1",
				eventId: null,
				points: -2,
				reason: "Violation",
			});
			await repo.recordEventAttendance(retentionAdmin, {
				memberId: "mem_a",
				termId: "term_past",
				eventId: null as unknown as string,
				points: 50,
				reason: "Old points",
			});
			await repo.recordEventAttendance(retentionAdmin, {
				memberId: "mem_b",
				termId: "term_1",
				eventId: null as unknown as string,
				points: 99,
				reason: "Theirs",
			});

			const { summary, records } = await repo.myHistory(plainMember, { termId: "term_1" }, NOW);
			expect(summary?.totalPoints).toBe(3);
			expect(summary?.recordCount).toBe(2);
			expect(summary?.status).toBe("probation");
			expect(records).toHaveLength(2);
			expect(records.every((record) => record.memberId === "mem_a")).toBe(true);
		});

		it("defaults to the current term when no termId is given", async () => {
			const { repo } = makeRepo();
			const { summary } = await repo.myHistory(plainMember, {}, NOW);
			expect(summary?.termId).toBe("term_1");
		});

		it("lists the member's terms with the current one flagged", async () => {
			const { repo } = makeRepo();
			const terms = await repo.listTerms(plainMember, NOW);
			const current = terms.find((term) => term.isCurrent);
			expect(current?.id).toBe("term_1");
			expect(terms.map((term) => term.id)).toContain("term_past");
		});
	});
});
