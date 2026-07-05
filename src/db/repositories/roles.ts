import { and, eq, ne, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { auditLogs, memberRoles, members, roles } from "@/db/schema";
import { createId } from "@/lib/ids";
import type { Actor, RoleKey } from "@/server/auth/permissions";
import { can, normalizeRoleKey, normalizeRoleKeys, roleKeys } from "@/server/auth/permissions";
import type * as schema from "../schema";

type Db = DrizzleD1Database<typeof schema>;

/** Role keys that exist but grant nothing yet: shown disabled, never assignable. */
const INACTIVE_ROLE_KEYS: RoleKey[] = [];
/** The implicit baseline role: never surfaced or assignable on the Roles page. */
const NON_ASSIGNABLE: RoleKey[] = ["member"];

export type AssignableRole = { key: RoleKey; label: string; description: string; assignable: boolean };

export type AdminEntry = { memberId: string; displayName: string; email: string; roleKeys: RoleKey[] };

export type SaveMemberRolesInput = { memberId: string; desiredRoleKeys: RoleKey[]; baseVersion: string };

export type RolesRepository = {
	listAssignableRoles(actor: Actor): Promise<AssignableRole[]>;
	listAdmins(actor: Actor): Promise<AdminEntry[]>;
	getMemberRoleKeys(actor: Actor, memberId: string): Promise<RoleKey[]>;
	baseVersionOf(keys: RoleKey[]): string;
	saveMemberRoles(actor: Actor, input: SaveMemberRolesInput): Promise<{ roleKeys: RoleKey[] }>;
};

export function createRolesRepository(db: Db): RolesRepository {
	const baseVersionOf = (keys: RoleKey[]) => [...keys].sort().join("|");

	async function loadKeys(memberId: string): Promise<RoleKey[]> {
		const rows = await db
			.select({ key: roles.key })
			.from(memberRoles)
			.innerJoin(roles, eq(roles.id, memberRoles.roleId))
			.where(eq(memberRoles.memberId, memberId));
		return normalizeRoleKeys(rows.map((r) => r.key)).sort();
	}

	function auditStmt(actor: Actor, targetId: string, action: "role:assign" | "role:revoke", key: RoleKey) {
		return db.insert(auditLogs).values({
			id: createId("aud"),
			actorMemberId: actor.memberId,
			actorContext: actor.context ?? "session",
			sharedTokenHash: actor.sharedTokenHash ?? null,
			sharedTokenLabel: actor.sharedTokenLabel ?? null,
			action,
			targetType: "member_role",
			targetId,
			detail: key,
			category: "role",
		});
	}

	return {
		baseVersionOf,

		async listAssignableRoles(actor) {
			if (!can(actor, "role:assign")) throw new Error("Not authorized to view roles.");
			const rows = await db.select().from(roles);
			const seen = new Set<RoleKey>();
			return rows.flatMap((r) => {
				const key = normalizeRoleKey(r.key);
				if (!key || seen.has(key) || NON_ASSIGNABLE.includes(key)) return [];
				seen.add(key);
				return [{
					key,
					label: r.label,
					description: r.description,
					assignable: !INACTIVE_ROLE_KEYS.includes(key),
				}];
			});
		},

		async listAdmins(actor) {
			if (!can(actor, "role:assign")) throw new Error("Not authorized to view admins.");
			const rows = await db
				.select({
					memberId: members.id,
					name: members.name,
					fullName: members.fullName,
					email: members.email,
					key: roles.key,
				})
				.from(memberRoles)
				.innerJoin(roles, eq(roles.id, memberRoles.roleId))
				.innerJoin(members, eq(members.id, memberRoles.memberId))
				.where(ne(roles.key, "member"));
			const byMember = new Map<string, AdminEntry>();
			for (const row of rows) {
				const key = normalizeRoleKey(row.key);
				if (!key) continue;
				let entry = byMember.get(row.memberId);
				if (!entry) {
					entry = {
						memberId: row.memberId,
						displayName: row.fullName || row.name || row.email,
						email: row.email,
						roleKeys: [],
					};
					byMember.set(row.memberId, entry);
				}
				if (!entry.roleKeys.includes(key)) entry.roleKeys.push(key);
			}
			return [...byMember.values()]
				.map((entry) => ({ ...entry, roleKeys: [...entry.roleKeys].sort() }))
				.sort((a, b) => a.displayName.localeCompare(b.displayName));
		},

		async getMemberRoleKeys(actor, memberId) {
			if (!can(actor, "role:assign")) throw new Error("Not authorized to read member roles.");
			return loadKeys(memberId);
		},

		async saveMemberRoles(actor, input) {
			if (!actor.memberId) throw new Error("Missing actor identity.");
			if (!can(actor, "role:assign")) throw new Error("Not authorized to assign roles.");

			const current = await loadKeys(input.memberId);
			if (baseVersionOf(current) !== input.baseVersion) {
				throw new Error("Roles changed. Reload and try again.");
			}

			const desired = [...new Set(input.desiredRoleKeys)];
			for (const key of desired) {
				if (!roleKeys.includes(key)) throw new Error(`Unknown role "${key}".`);
				if (NON_ASSIGNABLE.includes(key) || INACTIVE_ROLE_KEYS.includes(key)) {
					throw new Error(`Role "${key}" is not assignable.`);
				}
			}

			const currentSet = new Set(current);
			const desiredSet = new Set(desired);
			const toAdd = desired.filter((k) => !currentSet.has(k));
			const toRemove = current.filter((k) => !desiredSet.has(k));

			if ((toAdd.includes("super") || toRemove.includes("super")) && !actor.roles.includes("super")) {
				throw new Error("Only Overall Admins can grant or remove Overall Admin.");
			}
			if (toAdd.length === 0 && toRemove.length === 0) return { roleKeys: current };

			const roleRows = await db.select({ id: roles.id, key: roles.key }).from(roles);
			const idByKey = new Map<RoleKey, string>();
			for (const row of roleRows) {
				const key = normalizeRoleKey(row.key);
				if (key && !idByKey.has(key)) idByKey.set(key, row.id);
			}
			const superId = idByKey.get("super");

			// Race-safe last-super guard: single conditional delete, only if >1 super remains.
			if (toRemove.includes("super") && superId) {
				const removed = await db
					.delete(memberRoles)
					.where(
						and(
							eq(memberRoles.memberId, input.memberId),
							eq(memberRoles.roleId, superId),
							sql`(SELECT count(*) FROM member_roles WHERE role_id = ${superId}) > 1`,
						),
					)
					.returning({ memberId: memberRoles.memberId });
				if (removed.length === 0) throw new Error("At least one Overall Admin is required.");
			}

			// ponytail: adapter-neutral sequential writes; use a real transaction if role edits become high volume.
			const statements: unknown[] = [];
			for (const key of toAdd) {
				const roleId = idByKey.get(key);
				if (!roleId) throw new Error(`Unknown role "${key}".`);
				statements.push(db.insert(memberRoles).values({ memberId: input.memberId, roleId, assignedBy: actor.memberId }));
				statements.push(auditStmt(actor, input.memberId, "role:assign", key));
			}
			for (const key of toRemove) {
				statements.push(auditStmt(actor, input.memberId, "role:revoke", key));
				if (key === "super") continue; // already removed by the guarded delete
				const roleId = idByKey.get(key);
				if (!roleId) continue;
				statements.push(
					db.delete(memberRoles).where(and(eq(memberRoles.memberId, input.memberId), eq(memberRoles.roleId, roleId))),
				);
			}
			if (statements.length > 0) {
				for (const statement of statements) await statement;
			}

			return { roleKeys: await loadKeys(input.memberId) };
		},
	};
}
