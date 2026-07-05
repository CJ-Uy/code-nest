import { env } from "cloudflare:test";
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
			"event_invites",
			"event_staff",
			"event_rsvps",
			"crs_events",
			"terms",
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
		await env.DB.prepare(
			"INSERT INTO terms (id, name, retained_at, probation_below, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind("term_1", "Term 1", 20, 10, TERM_START.getTime(), TERM_END.getTime())
			.run();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	async function makeApprovedEvent(actor: Actor = owner) {
		const { repo } = makeRepos();
		return repo.create(actor, {
			title: "Practice Night",
			type: "official",
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
		expect((await db.select().from(schema.retentionRecords)).map((row) => row.points)).toEqual([null, null]);
		expect(await db.select().from(schema.notifications)).toHaveLength(1);
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
});
