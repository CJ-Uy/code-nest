import { env } from "cloudflare:test";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { isRosterSignInAllowed } from "./roster";

const NOW = new Date("2026-06-18T00:00:00.000Z");

describe("isRosterSignInAllowed", () => {
	beforeEach(async () => {
		await env.DB.prepare("DELETE FROM term_member_roster").run();
		await env.DB.prepare("DELETE FROM member_roles").run();
		await env.DB.prepare("DELETE FROM terms").run();
		await env.DB.prepare("DELETE FROM members").run();
		await env.DB.prepare("DELETE FROM roles").run();

		await env.DB.prepare(
			"INSERT INTO terms (id, name, retained_at, probation_below, starts_at, ends_at) VALUES (?, ?, ?, ?, ?, ?)",
		)
			.bind("term_current", "Term Current", 20, 10, NOW.getTime() - 1000, NOW.getTime() + 1000 * 60 * 60 * 24 * 30)
			.run();
		await env.DB.prepare("INSERT INTO roles (id, key, label, description, kind) VALUES (?, ?, ?, ?, ?)")
			.bind("role_super", "super", "Super admin", "Full access.", "admin")
			.run();
		await env.DB.prepare("INSERT INTO members (id, email, name, status) VALUES (?, ?, ?, ?)")
			.bind("seed", "seed@example.com", "Seed Admin", "active")
			.run();
	});

	it("allows an email present on the current term's roster", async () => {
		await env.DB.prepare("INSERT INTO term_member_roster (term_id, email, added_by, added_at) VALUES (?, ?, ?, ?)")
			.bind("term_current", "roster@example.com", "seed", NOW.getTime())
			.run();
		const db = drizzle(env.DB, { schema });

		await expect(isRosterSignInAllowed(db, "Roster@Example.com", NOW)).resolves.toBe(true);
	});

	it("rejects a new sign-in for an email absent from the current term's roster", async () => {
		const db = drizzle(env.DB, { schema });

		await expect(isRosterSignInAllowed(db, "outsider@example.com", NOW)).resolves.toBe(false);
	});

	it("deactivates and rejects an existing member who fell off the roster", async () => {
		await env.DB.prepare("INSERT INTO members (id, email, name, status) VALUES (?, ?, ?, ?)")
			.bind("mem_dropped", "dropped@example.com", "Dropped Member", "active")
			.run();
		const db = drizzle(env.DB, { schema });

		await expect(isRosterSignInAllowed(db, "dropped@example.com", NOW)).resolves.toBe(false);
		const [member] = await db
			.select({ status: schema.members.status })
			.from(schema.members)
			.where(eq(schema.members.id, "mem_dropped"));
		expect(member?.status).toBe("inactive");
	});

	it("lets a super admin sign in even without a roster row", async () => {
		await env.DB.prepare("INSERT INTO members (id, email, name, status) VALUES (?, ?, ?, ?)")
			.bind("mem_super", "super@example.com", "Super Admin", "active")
			.run();
		await env.DB.prepare("INSERT INTO member_roles (member_id, role_id, assigned_at) VALUES (?, ?, ?)")
			.bind("mem_super", "role_super", NOW.getTime())
			.run();
		const db = drizzle(env.DB, { schema });

		await expect(isRosterSignInAllowed(db, "super@example.com", NOW)).resolves.toBe(true);
	});

	it("lets the configured bootstrap super admin sign in before a member row exists", async () => {
		const db = drizzle(env.DB, { schema });

		await expect(
			isRosterSignInAllowed(
				db,
				" Bootstrap@Example.com ",
				NOW,
				"bootstrap@example.com",
			),
		).resolves.toBe(true);
	});
});
