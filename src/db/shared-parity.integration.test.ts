import { env } from "cloudflare:test";
import { drizzle } from "drizzle-orm/d1";
import { beforeEach, describe, expect, it } from "vitest";
import * as schema from "@/db/schema";
import { memberRoles, members, roles, sharedDevTokens } from "@/db/schema";
import { SharedApiDatabaseAdapter } from "./adapters/shared-api";
import { createSharedRepositories } from "./repositories";
import { createAuditRepository } from "./repositories/audit";
import { createMembersRepository } from "./repositories/members";
import { createMembersInternalHandlers } from "@/server/internal/members";
import type { Actor } from "@/server/auth/permissions";

const adminActor: Actor = {
	memberId: "mem_shared_admin",
	roles: ["super"],
};

const memberToken = "shared-member-token";

describe("shared members parity", () => {
	beforeEach(async () => {
		await env.DB.batch([
			env.DB.prepare("DELETE FROM member_roles"),
			env.DB.prepare("DELETE FROM shared_dev_tokens"),
			env.DB.prepare("DELETE FROM roles"),
			env.DB.prepare("DELETE FROM members"),
		]);

		const db = drizzle(env.DB, { schema });
		await db.insert(members).values([
			{ id: "mem_shared_admin", email: "admin@example.com", name: "Admin" },
			{ id: "mem_shared_member", email: "member@example.com", name: "Member" },
		]);
		await db.insert(roles).values({ id: "role_super_test", key: "super", label: "Super", description: "Full access", kind: "admin" });
		await db.insert(memberRoles).values({ memberId: "mem_shared_admin", roleId: "role_super_test", assignedBy: "mem_shared_admin" });
		await db.insert(sharedDevTokens).values({
			tokenHash: await hashToken("shared-test-token"),
			memberId: "mem_shared_admin",
			label: "Test admin token",
		});
		await db.insert(sharedDevTokens).values({
			tokenHash: await hashToken(memberToken),
			memberId: "mem_shared_member",
			label: "Test member token",
		});
	});

	it("returns the same authorized member list over Drizzle and the internal proxy", async () => {
		const db = drizzle(env.DB, { schema });
		const direct = createMembersRepository(db, createAuditRepository(db));
		const handlers = createMembersInternalHandlers({ db, deployEnv: "dev" });
		const adapter = new SharedApiDatabaseAdapter((request) => handlers.fetch(request), {
			baseUrl: "https://dev.example",
			token: "shared-test-token",
		});
		const shared = createSharedRepositories(adapter);

		const directMembers = await direct.list(adminActor, { limit: 10 });
		const sharedMembers = await shared.members.list(adminActor, { limit: 10 });

		expect(sharedMembers).toEqual(directMembers);
	});

	it("refuses a sharedDev deny operation over the proxy", async () => {
		const db = drizzle(env.DB, { schema });
		const handlers = createMembersInternalHandlers({ db, deployEnv: "dev" });
		const response = await handlers.fetch(
			new Request("https://dev.example/internal/members", {
				method: "POST",
				headers: {
					authorization: "Bearer shared-test-token",
					"content-type": "application/json",
				},
				body: JSON.stringify({ email: "blocked@example.com", name: "Blocked" }),
			}),
		);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: "Operation is disabled in shared development." });
	});

	it("enforces the same member management permission over the proxy", async () => {
		const db = drizzle(env.DB, { schema });
		const handlers = createMembersInternalHandlers({ db, deployEnv: "dev" });
		const response = await handlers.fetch(
			new Request("https://dev.example/internal/members", {
				headers: { authorization: `Bearer ${memberToken}` },
			}),
		);

		expect(response.status).toBe(403);
	});

	it("rejects requests without a mapped bearer token", async () => {
		const db = drizzle(env.DB, { schema });
		const handlers = createMembersInternalHandlers({ db, deployEnv: "dev" });

		const response = await handlers.fetch(new Request("https://dev.example/internal/members"));

		expect(response.status).toBe(401);
	});

	it("returns 404 outside the dev Worker", async () => {
		const db = drizzle(env.DB, { schema });
		const handlers = createMembersInternalHandlers({ db, deployEnv: "prod" });

		const response = await handlers.fetch(new Request("https://prod.example/internal/members"));

		expect(response.status).toBe(404);
	});
});

async function hashToken(token: string): Promise<string> {
	const value = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
	return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
