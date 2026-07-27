import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { createAuditRepository } from "./audit";
import { createEventsRepository } from "./events";

const eventsAdmin: Actor = { memberId: "mem_events", roles: ["events"] };
const retentionAdmin: Actor = { memberId: "mem_retention", roles: ["retention"] };
const owner: Actor = { memberId: "mem_owner", roles: ["member"] };
const adminStaff: Actor = { memberId: "mem_admin_staff", roles: ["member"] };
const scanner: Actor = { memberId: "mem_scanner", roles: ["member"] };
const outsider: Actor = { memberId: "mem_outsider", roles: ["member"] };

const START = new Date("2026-07-10T10:00:00.000Z");
const END = new Date("2026-07-10T12:00:00.000Z");
const TERM_START = new Date("2026-06-01T00:00:00.000Z");
const TERM_END = new Date("2026-10-31T00:00:00.000Z");

function makeRepos() {
	const db = drizzle(env.DB, { schema });
	const audit = createAuditRepository(db);
	return { db, repo: createEventsRepository(db, audit) };
}

describe("events repository on D1", () => {
	beforeEach(async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-07-10T09:45:00.000Z"));
		for (const table of [
			"notifications",
			"audit_logs",
			"retention_records",
			"crs_attendance",
			"event_point_awards",
			"event_invites",
			"event_staff",
			"event_rsvps",
			"event_type_rules",
			"crs_events",
			"terms",
			"point_types",
			"members",
		]) {
			await env.DB.prepare(`DELETE FROM ${table}`).run();
		}
		for (const [id, email, name] of [
			["mem_owner", "owner@example.com", "Owner"],
			["mem_admin_staff", "admin.staff@example.com", "Admin Staff"],
			["mem_scanner", "scanner@example.com", "Scanner"],
			["mem_outsider", "outsider@example.com", "Outsider"],
			["mem_events", "events@example.com", "Events Admin"],
			["mem_retention", "retention@example.com", "Retention Admin"],
			["mem_a", "a@example.com", "Member A"],
			["mem_b", "b@example.com", "Member B"],
		]) {
			await env.DB.prepare("INSERT INTO members (id, email, name, full_name) VALUES (?, ?, ?, ?)")
				.bind(id, email, name, name)
				.run();
		}
		for (const [id, key, label, countsTowardRetention, active, position] of [
			["pt_retention", "retention", "Retention", 1, 1, 0],
			["pt_frontliner", "frontliner", "Frontliner", 0, 1, 1],
			["pt_retired", "retired", "Retired", 0, 0, 2],
		] as const) {
			await env.DB.prepare(
				`INSERT INTO point_types
					(id, key, label, counts_toward_retention, active, position, updated_by)
				 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			)
				.bind(id, key, label, countsTowardRetention, active, position, "mem_retention")
				.run();
		}
		await env.DB.prepare(
			"INSERT INTO terms (id, name, retained_at, probation_below, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind("term_1", "Term 1", 20, 10, TERM_START.getTime(), TERM_END.getTime())
			.run();
		for (const [type, permission, label, colour, position] of [
			["official", "event:create_restricted", "Official", "primary", 0],
			["casual", null, "Casual", "emerald", 1],
			["birthday", null, "Birthday", "accent", 2],
		] as const) {
			await env.DB.prepare(
				"INSERT INTO event_type_rules (type, required_permission, label, colour, active, position) VALUES (?, ?, ?, ?, 1, ?)",
			)
				.bind(type, permission, label, colour, position)
				.run();
		}
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	async function makeApprovedEvent(actor: Actor = owner) {
		const { repo } = makeRepos();
		return repo.create(actor, {
			title: "Practice Night",
			type: "casual",
			place: "SOM 111",
			description: "Practice",
			startsAt: START,
			endsAt: END,
			capacity: null,
		});
	}

	it("publishes member-created events immediately and soft-delete hides without orphaning retention", async () => {
		const event = await makeApprovedEvent();
		const { repo, db } = makeRepos();
		expect(event.status).toBe("approved");
		expect(event.myRole).toBe("owner");
		expect((await repo.listPublished(outsider, {})).map((row) => row.id)).toEqual([event.id]);

		await repo.setPoints(eventsAdmin, event.id, 5);
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });
		await repo.softDelete(owner, event.id);

		expect(await repo.getById(outsider, event.id)).toBeNull();
		expect(await repo.listPublished(outsider, {})).toHaveLength(0);
		const retention = await db.select().from(schema.retentionRecords);
		expect(retention).toMatchObject([{ eventId: event.id, source: "event_attendance", points: 5 }]);
	});

	it("enforces owner, admin, scanner, and non-staff capabilities", async () => {
		const event = await makeApprovedEvent();
		const { repo } = makeRepos();

		await repo.addStaff(owner, event.id, adminStaff.memberId, "admin");
		await repo.addStaff(adminStaff, event.id, scanner.memberId, "scanner");
		await expect(repo.addStaff(scanner, event.id, outsider.memberId, "scanner")).rejects.toThrow("Not authorized");
		await expect(repo.recordScan(outsider, { eventId: event.id, memberId: "mem_a", termId: "term_1" })).rejects.toThrow(
			"Not authorized",
		);

		const scanned = await repo.recordScan(scanner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });
		expect(scanned.alreadyPresent).toBe(false);
		await expect(repo.softDelete(adminStaff, event.id)).rejects.toThrow("Not authorized");
		await expect(repo.transferOwnership(adminStaff, event.id, outsider.memberId)).rejects.toThrow("Not authorized");

		await repo.transferOwnership(owner, event.id, outsider.memberId);
		const moved = await repo.getById(outsider, event.id);
		expect(moved?.myRole).toBe("owner");
		expect(await repo.resolveCapability(owner, { id: event.id, createdBy: outsider.memberId })).toBe("admin");
	});

	it("lists owner first and staff with roles and names", async () => {
		const event = await makeApprovedEvent();
		const { repo } = makeRepos();

		await repo.addStaff(owner, event.id, adminStaff.memberId, "admin");
		await repo.addStaff(owner, event.id, scanner.memberId, "scanner");

		expect(await repo.listStaff(outsider, event.id)).toEqual([
			{ memberId: owner.memberId, fullName: "Owner", name: "Owner", role: "owner" },
			{ memberId: adminStaff.memberId, fullName: "Admin Staff", name: "Admin Staff", role: "admin" },
			{ memberId: scanner.memberId, fullName: "Scanner", name: "Scanner", role: "scanner" },
		]);
	});

	it("enforces check-in window for scanners while owner, admin, and event moderators override it", async () => {
		const event = await makeApprovedEvent();
		const { repo } = makeRepos();
		await repo.addStaff(owner, event.id, adminStaff.memberId, "admin");
		await repo.addStaff(owner, event.id, scanner.memberId, "scanner");

		vi.setSystemTime(new Date("2026-07-10T09:00:00.000Z"));
		await expect(repo.recordScan(scanner, { eventId: event.id, memberId: "mem_a", termId: "term_1" })).rejects.toThrow(
			"Check-in is closed",
		);
		await expect(repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" })).resolves.toMatchObject({
			alreadyPresent: false,
		});
		await expect(
			repo.recordScan(adminStaff, { eventId: event.id, memberId: "mem_b", termId: "term_1" }),
		).resolves.toMatchObject({ alreadyPresent: false });
		await expect(
			repo.recordScan(eventsAdmin, { eventId: event.id, memberId: scanner.memberId, termId: "term_1" }),
		).resolves.toMatchObject({ alreadyPresent: false });
	});

	it("re-values event-attendance points and late scans inherit the current value", async () => {
		const event = await makeApprovedEvent(owner);
		const { repo, db } = makeRepos();

		await repo.setPoints(eventsAdmin, event.id, 5);
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });
		expect(await db.select().from(schema.notifications)).toHaveLength(0);
		await expect(repo.setPoints(retentionAdmin, event.id, 9)).rejects.toThrow("Not authorized");

		await expect(repo.setPoints(eventsAdmin, event.id, 9)).resolves.toEqual({ updated: 1 });
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_b", termId: "term_1" });

		const rows = await db.select().from(schema.retentionRecords).orderBy(schema.retentionRecords.memberId);
		expect(rows.map((row) => [row.memberId, row.points])).toEqual([
			["mem_a", 9],
			["mem_b", 9],
		]);
		expect(await db.select().from(schema.notifications)).toHaveLength(1);

		await expect(repo.setPoints(eventsAdmin, event.id, null)).resolves.toEqual({ updated: 2 });
		expect(await db.select().from(schema.retentionRecords)).toHaveLength(0);
		expect(await db.select().from(schema.notifications)).toHaveLength(1);
	});

	it("validates every setAwards value inside the repository", async () => {
		const event = await makeApprovedEvent();
		const { repo } = makeRepos();

		for (const awards of [
			[
				{ pointTypeId: "pt_retention", points: 2 },
				{ pointTypeId: "pt_retention", points: 3 },
			],
			[{ pointTypeId: "pt_retention", points: 2.5 }],
			[{ pointTypeId: "pt_retention", points: 101 }],
			[{ pointTypeId: "pt_missing", points: 2 }],
			[{ pointTypeId: "pt_retired", points: 2 }],
		]) {
			await expect(repo.setAwards(eventsAdmin, event.id, awards)).rejects.toThrow();
		}

		const tooMany = Array.from({ length: 101 }, (_, index) => ({
			pointTypeId: `pt_${index}`,
			points: 1,
		}));
		await expect(repo.setAwards(eventsAdmin, event.id, tooMany)).rejects.toThrow("at most 100");
		await expect(
			repo.setAwards(retentionAdmin, event.id, [{ pointTypeId: "pt_retention", points: 2 }]),
		).rejects.toThrow("Not authorized");
	});

	it("reconciles attendance awards while preserving their scan provenance", async () => {
		const event = await makeApprovedEvent();
		const { repo, db } = makeRepos();

		await repo.setAwards(eventsAdmin, event.id, [{ pointTypeId: "pt_retention", points: 2 }]);
		vi.setSystemTime(new Date("2026-07-10T10:05:00.000Z"));
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });

		const [original] = await db.select().from(schema.retentionRecords);
		const [attendance] = await db.select().from(schema.crsAttendance);
		const originalRecordedAt = original.recordedAt;

		vi.setSystemTime(new Date("2026-07-10T11:00:00.000Z"));
		await repo.setAwards(eventsAdmin, event.id, [
			{ pointTypeId: "pt_retention", points: 2 },
			{ pointTypeId: "pt_frontliner", points: 3 },
		]);

		const rowsAfterAdd = await db
			.select()
			.from(schema.retentionRecords)
			.orderBy(schema.retentionRecords.pointTypeId);
		expect(rowsAfterAdd.map((row) => [row.pointTypeId, row.points])).toEqual([
			["pt_frontliner", 3],
			["pt_retention", 2],
		]);
		const retentionAfterAdd = rowsAfterAdd.find((row) => row.pointTypeId === "pt_retention")!;
		const frontlinerAfterAdd = rowsAfterAdd.find((row) => row.pointTypeId === "pt_frontliner")!;
		expect(retentionAfterAdd.recordedAt).toEqual(originalRecordedAt);
		expect(frontlinerAfterAdd.recordedBy).toBe(owner.memberId);
		expect(frontlinerAfterAdd.recordedAt).toEqual(attendance.scannedAt);

		await repo.setAwards(eventsAdmin, event.id, [{ pointTypeId: "pt_retention", points: 4 }]);
		const rowsAfterRemove = await db
			.select()
			.from(schema.retentionRecords)
			.orderBy(schema.retentionRecords.pointTypeId);
		expect(rowsAfterRemove.map((row) => [row.pointTypeId, row.points])).toEqual([
			["pt_retention", 4],
		]);
		expect((await db.select().from(schema.crsEvents).where(eq(schema.crsEvents.id, event.id)))[0].points).toBe(4);

		await repo.setAwards(eventsAdmin, event.id, [{ pointTypeId: "pt_frontliner", points: 3 }]);
		expect((await db.select().from(schema.crsEvents).where(eq(schema.crsEvents.id, event.id)))[0].points).toBeNull();
	});

	it("derives scan rows from every active event award", async () => {
		const event = await makeApprovedEvent();
		const { db, repo } = makeRepos();
		await repo.setAwards(eventsAdmin, event.id, [
			{ pointTypeId: "pt_retention", points: 2 },
			{ pointTypeId: "pt_frontliner", points: 3 },
		]);

		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });

		const rows = await db
			.select()
			.from(schema.retentionRecords)
			.orderBy(schema.retentionRecords.pointTypeId);
		expect(rows.map((row) => [row.pointTypeId, row.points, row.eventId])).toEqual([
			["pt_frontliner", 3, event.id],
			["pt_retention", 2, event.id],
		]);
	});

	it("skips inactive scan awards while preserving inactive history", async () => {
		const event = await makeApprovedEvent();
		const { db, repo } = makeRepos();
		await repo.setAwards(eventsAdmin, event.id, [
			{ pointTypeId: "pt_retention", points: 2 },
			{ pointTypeId: "pt_frontliner", points: 3 },
		]);
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });
		await db.update(schema.pointTypes).set({ active: false }).where(eq(schema.pointTypes.id, "pt_frontliner"));
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_b", termId: "term_1" });
		await repo.setAwards(eventsAdmin, event.id, [{ pointTypeId: "pt_retention", points: 4 }]);

		const rows = await db
			.select()
			.from(schema.retentionRecords)
			.orderBy(schema.retentionRecords.memberId, schema.retentionRecords.pointTypeId);
		expect(
			rows.filter((row) => row.memberId === "mem_b").map((row) => row.pointTypeId),
		).toEqual(["pt_retention"]);
		expect(
			rows.some((row) => row.memberId === "mem_a" && row.pointTypeId === "pt_frontliner"),
		).toBe(true);
	});

	it("keeps setPoints scoped to Retention and returns distinct attendees", async () => {
		const event = await makeApprovedEvent();
		const { db, repo } = makeRepos();
		await repo.setAwards(eventsAdmin, event.id, [
			{ pointTypeId: "pt_retention", points: 2 },
			{ pointTypeId: "pt_frontliner", points: 3 },
		]);
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_b", termId: "term_1" });

		await expect(repo.setPoints(eventsAdmin, event.id, 7)).resolves.toEqual({ updated: 2 });

		const awards = await db.select().from(schema.eventPointAwards).orderBy(schema.eventPointAwards.pointTypeId);
		expect(awards.map((row) => [row.pointTypeId, row.points])).toEqual([
			["pt_frontliner", 3],
			["pt_retention", 7],
		]);
		expect((await db.select().from(schema.crsEvents).where(eq(schema.crsEvents.id, event.id)))[0].points).toBe(7);
		expect(
			(await db.select().from(schema.retentionRecords))
				.filter((row) => row.pointTypeId === "pt_frontliner")
				.every((row) => row.points === 3),
		).toBe(true);

		await expect(repo.setPoints(eventsAdmin, event.id, null)).resolves.toEqual({ updated: 2 });
		expect(
			(await db.select().from(schema.eventPointAwards)).map((row) => [row.pointTypeId, row.points]),
		).toEqual([["pt_frontliner", 3]]);
		expect(
			(await db.select().from(schema.retentionRecords)).map((row) => [row.pointTypeId, row.points]),
		).toEqual([
			["pt_frontliner", 3],
			["pt_frontliner", 3],
		]);
		expect((await db.select().from(schema.crsEvents).where(eq(schema.crsEvents.id, event.id)))[0].points).toBeNull();
	});

	it("rolls back award reconciliation when its audit insert fails", async () => {
		const event = await makeApprovedEvent();
		const { repo, db } = makeRepos();
		await env.DB.prepare(`
			CREATE TRIGGER fail_set_awards_audit
			BEFORE INSERT ON audit_logs
			WHEN NEW.action = 'event:set_awards'
			BEGIN
				SELECT RAISE(ABORT, 'audit unavailable');
			END
		`).run();

		try {
			await expect(
				repo.setAwards(eventsAdmin, event.id, [{ pointTypeId: "pt_retention", points: 2 }]),
			).rejects.toThrow();
			expect(await db.select().from(schema.eventPointAwards)).toHaveLength(0);
			expect((await db.select().from(schema.crsEvents))[0].points).toBeNull();
		} finally {
			await env.DB.prepare("DROP TRIGGER fail_set_awards_audit").run();
		}
	});

	it("keeps point awards committed when attendee notifications fail", async () => {
		const event = await makeApprovedEvent();
		const { repo, db } = makeRepos();
		vi.setSystemTime(new Date("2026-07-10T10:05:00.000Z"));
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_b", termId: "term_1" });
		await env.DB.prepare(`
			CREATE TRIGGER fail_points_awarded_notification
			BEFORE INSERT ON notifications
			WHEN NEW.kind = 'points_awarded'
			BEGIN
				SELECT RAISE(ABORT, 'notifications unavailable');
			END
		`).run();
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

		try {
			await expect(
				repo.setAwards(eventsAdmin, event.id, [{ pointTypeId: "pt_retention", points: 5 }]),
			).resolves.toEqual({ updated: 2 });
			expect(
				await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, "event:set_awards")),
			).toHaveLength(1);
			expect(errorSpy).toHaveBeenCalledTimes(2);
		} finally {
			await env.DB.prepare("DROP TRIGGER fail_points_awarded_notification").run();
			errorSpy.mockRestore();
		}
	});

	it("invites members idempotently without changing event visibility", async () => {
		const event = await makeApprovedEvent();
		const { repo, db } = makeRepos();

		await expect(repo.invite(outsider, event.id, ["mem_a"])).rejects.toThrow("Not authorized");
		await expect(repo.invite(owner, event.id, ["mem_a", "mem_b", "mem_a"])).resolves.toEqual({ invited: 2 });
		await expect(repo.invite(owner, event.id, ["mem_a"])).resolves.toEqual({ invited: 0 });

		const invites = await repo.listInvites(owner, event.id);
		expect(invites.map((invite) => invite.memberId)).toEqual(["mem_a", "mem_b"]);
		expect(await db.select().from(schema.notifications)).toHaveLength(2);
		expect((await repo.listPublished(outsider, {})).map((row) => row.id)).toEqual([event.id]);
	});

	it("limits scanner member search to exact lookups and staff-only attendance reads", async () => {
		const event = await makeApprovedEvent();
		const { repo } = makeRepos();
		await repo.addStaff(owner, event.id, scanner.memberId, "scanner");
		await repo.recordScan(scanner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });

		await expect(repo.searchAttendableMembers(outsider, { eventId: event.id, query: "Member", limit: 20 })).rejects.toThrow(
			"Not authorized",
		);
		expect(await repo.searchAttendableMembers(scanner, { eventId: event.id, query: "Member", limit: 20 })).toEqual([]);
		expect(await repo.searchAttendableMembers(scanner, { eventId: event.id, query: "mem_a", limit: 20 })).toMatchObject([
			{ memberId: "mem_a", alreadyScanned: true },
		]);
		expect(await repo.searchAttendableMembers(owner, { eventId: event.id, query: "Member", limit: 20 })).toHaveLength(2);

		await expect(repo.listAttendance(outsider, event.id)).rejects.toThrow("Not authorized");
		expect(await repo.listAttendance(scanner, event.id)).toMatchObject([{ memberId: "mem_a" }]);
	});

	it("returns the original scan time and scanner on a duplicate scan", async () => {
		const event = await makeApprovedEvent();
		const { repo } = makeRepos();
		await repo.addStaff(owner, event.id, adminStaff.memberId, "admin");

		vi.setSystemTime(new Date("2026-07-10T10:05:00.000Z"));
		const first = await repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });
		expect(first.alreadyPresent).toBe(false);
		expect(first.memberName).toBe("Member A");
		expect(first.scannedByName).toBe("Owner");
		expect(first.scannedAt.toISOString()).toBe("2026-07-10T10:05:00.000Z");

		// A different scanner re-scans the same badge 20 minutes later.
		vi.setSystemTime(new Date("2026-07-10T10:25:00.000Z"));
		const second = await repo.recordScan(adminStaff, { eventId: event.id, memberId: "mem_a", termId: "term_1" });
		expect(second.alreadyPresent).toBe(true);
		expect(second.memberName).toBe("Member A");
		// The bug being fixed: this used to report now() and omit the scanner.
		expect(second.scannedAt.toISOString()).toBe("2026-07-10T10:05:00.000Z");
		expect(second.scannedByName).toBe("Owner");
	});

	it("lets owners undo a scan and removes the points with it, but blocks scanners", async () => {
		const event = await makeApprovedEvent();
		const { repo, db } = makeRepos();
		await repo.setPoints(eventsAdmin, event.id, 5);
		await repo.addStaff(owner, event.id, scanner.memberId, "scanner");
		await repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_1" });

		await expect(repo.undoScan(scanner, { eventId: event.id, memberId: "mem_a" })).rejects.toThrow("Not authorized");

		await expect(repo.undoScan(owner, { eventId: event.id, memberId: "mem_a" })).resolves.toEqual({ removed: true });
		expect(await db.select().from(schema.crsAttendance)).toHaveLength(0);
		// The points row must die with the attendance row, or the member keeps
		// credit for an event they were removed from.
		expect(await db.select().from(schema.retentionRecords)).toHaveLength(0);

		// Undoing something that is not there is a no-op, not an error.
		await expect(repo.undoScan(owner, { eventId: event.id, memberId: "mem_a" })).resolves.toEqual({ removed: false });
	});

	it("rejects attendance for an inactive or client-selected school year", async () => {
		const event = await makeApprovedEvent();
		const { repo, db } = makeRepos();
		await env.DB.prepare(
			"INSERT INTO terms (id, name, retained_at, probation_below, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind("term_old", "Old Term", 20, 10, new Date("2025-01-01").getTime(), new Date("2025-06-01").getTime())
			.run();

		await expect(repo.recordScan(owner, { eventId: event.id, memberId: "mem_a", termId: "term_old" })).rejects.toThrow(
			"No active school year",
		);
		expect(await db.select().from(schema.crsAttendance)).toHaveLength(0);
		expect(await db.select().from(schema.retentionRecords)).toHaveLength(0);
	});

	it("gates event creation on the configured type rules", async () => {
		await env.DB.prepare("DELETE FROM event_type_rules").run();
		await env.DB.prepare("INSERT INTO event_type_rules (type, required_permission) VALUES ('casual', NULL)").run();
		await env.DB.prepare("INSERT INTO event_type_rules (type, required_permission) VALUES ('birthday', NULL)").run();
		await env.DB.prepare(
			"INSERT INTO event_type_rules (type, required_permission) VALUES ('official', 'event:create_restricted')",
		).run();
		const { repo } = makeRepos();
		const base = {
			title: "Gated",
			place: "SOM 111",
			description: "Gated",
			startsAt: START,
			endsAt: END,
			capacity: null,
		};

		await expect(repo.create(owner, { ...base, type: "official" })).rejects.toThrow("Not authorized");
		await expect(repo.create(owner, { ...base, type: "casual" })).resolves.toMatchObject({ type: "casual" });
		await expect(repo.create(eventsAdmin, { ...base, type: "official" })).resolves.toMatchObject({ type: "official" });
	});

	it("gates a type-changing update the same way as create, without blocking unrelated edits", async () => {
		const { repo } = makeRepos();

		// A plain member who owns a casual event cannot promote it to official themselves...
		const casualEvent = await makeApprovedEvent(owner);
		await expect(repo.update(owner, casualEvent.id, { type: "official" })).rejects.toThrow("Not authorized");
		expect((await repo.getById(owner, casualEvent.id))?.type).toBe("casual");

		// ...but an actor holding event:create_restricted can make that same change.
		await expect(repo.update(eventsAdmin, casualEvent.id, { type: "official" })).resolves.toMatchObject({
			type: "official",
		});

		// An existing official event owned by a plain member (e.g. after a transfer) must
		// still let its owner edit unrelated fields — the type-rule check must only fire
		// when the patch actually changes the type, not on every update.
		const officialEvent = await repo.create(eventsAdmin, {
			title: "Formal Assembly",
			type: "official",
			place: "Gym",
			description: "Formal",
			startsAt: START,
			endsAt: END,
			capacity: null,
		});
		await repo.transferOwnership(eventsAdmin, officialEvent.id, owner.memberId);
		await expect(repo.update(owner, officialEvent.id, { title: "Formal Assembly (Updated)", type: "official" })).resolves.toMatchObject({
			type: "official",
			title: "Formal Assembly (Updated)",
		});
	});

	it("rejects an event type that has no row at all", async () => {
		const { repo } = makeRepos();
		await expect(
			repo.create(eventsAdmin, {
				title: "Ghost", type: "does_not_exist", place: "SOM 111",
				description: "Ghost", startsAt: START, endsAt: END, capacity: null,
			}),
		).rejects.toThrow("Not authorized");
		const event = await makeApprovedEvent();
		await expect(repo.update(owner, event.id, { type: "does_not_exist" })).rejects.toThrow("Not authorized");
	});

	it("rejects an inactive type for new events but still allows editing an existing one", async () => {
		const { repo } = makeRepos();
		const event = await repo.create(owner, {
			title: "Retro", type: "casual", place: "SOM 111",
			description: "Retro", startsAt: START, endsAt: END, capacity: null,
		});

		await env.DB.prepare("UPDATE event_type_rules SET active = 0 WHERE type = ?").bind("casual").run();

		// No new casual events...
		await expect(
			repo.create(owner, {
				title: "Another", type: "casual", place: "SOM 111",
				description: "Another", startsAt: START, endsAt: END, capacity: null,
			}),
		).rejects.toThrow("Not authorized");

		// ...but the existing one is still editable, because the type is unchanged.
		await expect(repo.update(owner, event.id, { title: "Retro renamed" })).resolves.toMatchObject({
			title: "Retro renamed",
		});
		await expect(repo.update(owner, event.id, { type: "casual", title: "Again" })).resolves.toMatchObject({
			title: "Again",
		});

		const officialEvent = await repo.create(eventsAdmin, {
			title: "Formal Assembly", type: "official", place: "Gym",
			description: "Formal", startsAt: START, endsAt: END, capacity: null,
		});
		await expect(repo.update(eventsAdmin, officialEvent.id, { type: "casual" })).rejects.toThrow("Not authorized");
	});
});
