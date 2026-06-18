import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { auditLogs, members } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { createAuditRepository } from "./audit";
import { createMembersRepository } from "./members";

const adminActor: Actor = {
	memberId: "mem_test_admin",
	roles: ["super"],
};

const memberActor: Actor = {
	memberId: "mem_test_member",
	roles: ["member"],
};

describe("members repository on D1", () => {
	beforeEach(async () => {
		await env.DB.prepare("DELETE FROM audit_logs").run();
		await env.DB.prepare("DELETE FROM members").run();
	});

	it("creates and lists members for an authorized actor", async () => {
		await env.DB.prepare("INSERT INTO members (id, email, name) VALUES (?, ?, ?)")
			.bind(adminActor.memberId, "admin@example.com", "Admin")
			.run();
		const db = drizzle(env.DB, { schema });
		const repository = createMembersRepository(db, createAuditRepository(db));

		const created = await repository.create(adminActor, {
			email: "new-member@example.com",
			name: "New Member",
		});
		const listed = await repository.list(adminActor, { limit: 10 });
		const [audit] = await db.select().from(auditLogs);

		expect(created.email).toBe("new-member@example.com");
		expect(listed.map((member) => member.id)).toContain(created.id);
		expect(audit).toMatchObject({
			actorMemberId: adminActor.memberId,
			action: "member:create",
			targetType: "member",
			targetId: created.id,
			category: "member",
		});
	});

	it("rejects an admin read without member management permission", async () => {
		const db = drizzle(env.DB, { schema });
		const repository = createMembersRepository(db, createAuditRepository(db));

		await expect(repository.list(memberActor, { limit: 10 })).rejects.toThrow("Not authorized");
	});
});
