import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { createAuditRepository } from "./audit";
import { allowedEventTypes, canCreateType, createEventTypeRulesRepository } from "./eventTypeRules";

const plainMember: Actor = { memberId: "mem_plain", roles: ["member"] };
const eventsAdmin: Actor = { memberId: "mem_events", roles: ["events"] };
const superAdmin: Actor = { memberId: "mem_super", roles: ["super"] };

function makeRepo() {
	const db = drizzle(env.DB, { schema });
	return createEventTypeRulesRepository(db, createAuditRepository(db));
}

describe("event type rules on D1", () => {
	beforeEach(async () => {
		await env.DB.prepare("DELETE FROM audit_logs").run();
		await env.DB.prepare("DELETE FROM members").run();
		for (const [id, email] of [
			["mem_plain", "plain@example.com"],
			["mem_events", "events@example.com"],
			["mem_super", "super@example.com"],
		]) {
			await env.DB.prepare("INSERT INTO members (id, email) VALUES (?, ?)").bind(id, email).run();
		}
		await env.DB.prepare("DELETE FROM event_type_rules").run();
		await env.DB.prepare("INSERT INTO event_type_rules (type, required_permission) VALUES ('casual', NULL)").run();
		await env.DB.prepare("INSERT INTO event_type_rules (type, required_permission) VALUES ('birthday', NULL)").run();
		await env.DB.prepare(
			"INSERT INTO event_type_rules (type, required_permission) VALUES ('official', 'event:create_restricted')",
		).run();
	});

	it("ships seeded defaults: casual and birthday open, official restricted", async () => {
		const rules = await makeRepo().list();
		expect(rules).toEqual(
			expect.arrayContaining([
				{ type: "casual", requiredPermission: null },
				{ type: "birthday", requiredPermission: null },
				{ type: "official", requiredPermission: "event:create_restricted" },
			]),
		);
	});

	it("gates types by permission", async () => {
		const rules = await makeRepo().list();
		expect(canCreateType(plainMember, rules, "casual")).toBe(true);
		expect(canCreateType(plainMember, rules, "official")).toBe(false);
		expect(canCreateType(eventsAdmin, rules, "official")).toBe(true);
		expect(canCreateType(superAdmin, rules, "official")).toBe(true);
		expect(allowedEventTypes(plainMember, rules).sort()).toEqual(["birthday", "casual"]);
	});

	it("applies an admin's change at runtime", async () => {
		const repo = makeRepo();
		await repo.setRequiredPermission(superAdmin, "casual", "event:create_restricted");
		const rules = await repo.list();
		expect(canCreateType(plainMember, rules, "casual")).toBe(false);
		expect(canCreateType(eventsAdmin, rules, "casual")).toBe(true);
	});

	it("rejects a write from an actor without role:assign", async () => {
		await expect(makeRepo().setRequiredPermission(plainMember, "casual", null)).rejects.toThrow("Not authorized");
	});

	it("fails closed when required_permission is an unrecognized value written out-of-band", async () => {
		await env.DB.prepare("UPDATE event_type_rules SET required_permission = ? WHERE type = ?")
			.bind("event:create_restrictedd", "birthday")
			.run();
		const rules = await makeRepo().list();
		expect(rules).toEqual(expect.arrayContaining([{ type: "birthday", requiredPermission: "event:create_restrictedd" }]));
		expect(canCreateType(plainMember, rules, "birthday")).toBe(false);
		expect(canCreateType(eventsAdmin, rules, "birthday")).toBe(false);
		expect(canCreateType(superAdmin, rules, "birthday")).toBe(true);
	});
});
