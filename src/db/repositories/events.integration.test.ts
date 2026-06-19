import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { createAuditRepository } from "./audit";
import { createEventsRepository } from "./events";
import { createRetentionRepository } from "./retention";

const retentionAdmin: Actor = { memberId: "mem_admin", roles: ["retention"] };
const member: Actor = { memberId: "mem_a", roles: ["member"] };

const START = new Date("2026-07-10T10:00:00.000Z");
const END = new Date("2026-07-10T12:00:00.000Z");
const TERM_START = new Date("2026-06-01T00:00:00.000Z");
const TERM_END = new Date("2026-10-31T00:00:00.000Z");

function makeRepos() {
	const db = drizzle(env.DB, { schema });
	const audit = createAuditRepository(db);
	const retention = createRetentionRepository(db, audit);
	return { db, repo: createEventsRepository(db, audit, retention) };
}

describe("events repository on D1", () => {
	beforeEach(async () => {
		for (const table of ["retention_records", "crs_attendance", "event_rsvps", "crs_events", "terms", "members"]) {
			await env.DB.prepare(`DELETE FROM ${table}`).run();
		}
		await env.DB.prepare("INSERT INTO members (id, email, name, full_name) VALUES (?, ?, ?, ?)")
			.bind("mem_a", "a@example.com", "A", "Member A")
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

	async function makeApprovedEvent() {
		const { repo } = makeRepos();
		const created = await repo.create(retentionAdmin, {
			title: "Practice Night",
			type: "official",
			place: "SOM 111",
			description: "Practice",
			startsAt: START,
			endsAt: END,
			points: 5,
			capacity: null,
		});
		await repo.approve(retentionAdmin, created.id);
		return created.id;
	}

	it("creates a pending event and only a retention admin can approve it", async () => {
		const { repo } = makeRepos();
		const created = await repo.create(retentionAdmin, {
			title: "Practice Night",
			type: "official",
			place: "SOM 111",
			description: "Practice",
			startsAt: START,
			endsAt: END,
			points: 5,
			capacity: null,
		});
		expect(created.status).toBe("pending");
		await expect(repo.approve(member, created.id)).rejects.toThrow("Not authorized");
		const approved = await repo.approve(retentionAdmin, created.id);
		expect(approved.status).toBe("approved");
		expect(approved.approvedBy).toBe("mem_admin");
	});

	it("only lists approved events to plain members", async () => {
		const { repo } = makeRepos();
		await repo.create(retentionAdmin, {
			title: "Pending One",
			type: "casual",
			place: "x",
			description: "x",
			startsAt: START,
			endsAt: null,
			points: null,
			capacity: null,
		});
		const id = await makeApprovedEvent();
		const approved = await repo.listApproved(member, {});
		expect(approved.map((event) => event.id)).toEqual([id]);
	});

	it("sets and clears a member RSVP idempotently", async () => {
		const id = await makeApprovedEvent();
		const { repo, db } = makeRepos();
		await repo.setRsvp(member, { eventId: id, state: "going" });
		await repo.setRsvp(member, { eventId: id, state: "going" });
		const rows = await db.select().from(schema.eventRsvps);
		expect(rows).toHaveLength(1);
		expect(rows[0].state).toBe("going");
		await repo.setRsvp(member, { eventId: id, state: "none" });
		const cleared = await db.select().from(schema.eventRsvps);
		expect(cleared[0].state).toBe("none");
	});

	it("records a scan once, is idempotent on re-scan, and creates an event-attendance retention row", async () => {
		const id = await makeApprovedEvent();
		const { repo, db } = makeRepos();
		const first = await repo.recordScan(retentionAdmin, { eventId: id, memberId: "mem_a", termId: "term_1" });
		expect(first.alreadyPresent).toBe(false);
		const second = await repo.recordScan(retentionAdmin, { eventId: id, memberId: "mem_a", termId: "term_1" });
		expect(second.alreadyPresent).toBe(true);
		const attendance = await db.select().from(schema.crsAttendance);
		expect(attendance).toHaveLength(1);
		const retention = await db.select().from(schema.retentionRecords);
		expect(retention).toHaveLength(1);
		expect(retention[0]).toMatchObject({ source: "event_attendance", points: 5, eventId: id, memberId: "mem_a" });
	});

	it("denies a plain member from scanning attendance", async () => {
		const id = await makeApprovedEvent();
		const { repo } = makeRepos();
		await expect(repo.recordScan(member, { eventId: id, memberId: "mem_a", termId: "term_1" })).rejects.toThrow(
			"Not authorized",
		);
	});

	it("manual search finds an attendable member and flags whether they are already scanned", async () => {
		const id = await makeApprovedEvent();
		const { repo } = makeRepos();
		const before = await repo.searchAttendableMembers(retentionAdmin, { eventId: id, query: "Member A" });
		expect(before[0]).toMatchObject({ memberId: "mem_a", alreadyScanned: false });
		await repo.recordScan(retentionAdmin, { eventId: id, memberId: "mem_a", termId: "term_1" });
		const after = await repo.searchAttendableMembers(retentionAdmin, { eventId: id, query: "a@example.com" });
		expect(after[0]).toMatchObject({ memberId: "mem_a", alreadyScanned: true });
	});
});
