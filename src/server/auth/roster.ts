import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { members, memberRoles, roles, termMemberRoster, terms } from "@/db/schema";

type MemberUpdate = Partial<InferInsertModel<typeof members>>;

type Db = {
	select(columns: { id: typeof terms.id }): {
		from(table: typeof terms): {
			where(condition: unknown): {
				orderBy(column: unknown): {
					limit(n: number): Promise<{ id: string }[]> | { id: string }[];
				};
			};
		};
	};
	select(columns: { key: typeof roles.key }): {
		from(table: typeof memberRoles): {
			innerJoin(table: typeof roles, condition: unknown): {
				where(condition: unknown): Promise<unknown> | unknown;
			};
		};
	};
	select(columns: { email: typeof termMemberRoster.email }): {
		from(table: typeof termMemberRoster): {
			where(condition: unknown): {
				limit(n: number): Promise<{ email: string }[]> | { email: string }[];
			};
		};
	};
	select(columns: { id: typeof members.id }): {
		from(table: typeof members): {
			where(condition: unknown): {
				limit(n: number): Promise<{ id: string }[]> | { id: string }[];
			};
		};
	};
	update(table: typeof members): {
		set(value: MemberUpdate): {
			where(condition: unknown): Promise<unknown> | unknown;
		};
	};
};

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

async function getCurrentTermId(db: Db, now: Date): Promise<string | null> {
	const [term] = await db
		.select({ id: terms.id })
		.from(terms)
		.where(and(lte(terms.startsAt, now), gte(terms.endsAt, now)))
		.orderBy(desc(terms.startsAt))
		.limit(1);
	return term?.id ?? null;
}

async function isMemberSuperAdmin(db: Db, memberId: string): Promise<boolean> {
	const rows = await db
		.select({ key: roles.key })
		.from(memberRoles)
		.innerJoin(roles, eq(roles.id, memberRoles.roleId))
		.where(eq(memberRoles.memberId, memberId));
	if (!Array.isArray(rows) || !rows.every((row): row is { key: string } => typeof (row as { key?: unknown })?.key === "string")) {
		throw new Error("isMemberSuperAdmin: unexpected row shape from role join query");
	}
	return rows.some((row) => row.key === "super");
}

async function isEmailOnRoster(db: Db, termId: string, email: string): Promise<boolean> {
	const [row] = await db
		.select({ email: termMemberRoster.email })
		.from(termMemberRoster)
		.where(and(eq(termMemberRoster.termId, termId), eq(termMemberRoster.email, email)))
		.limit(1);
	return Boolean(row);
}

async function deactivateMemberByEmail(db: Db, email: string): Promise<void> {
	await db.update(members).set({ status: "inactive", updatedAt: new Date() }).where(eq(members.email, email));
}

/**
 * The v5 sign-in gate: an email must be on the CURRENT active term's roster to
 * sign in, unless the existing member already holds the super role (so a
 * misconfigured or stale roster can never lock out the org's own admins).
 * An existing member who falls off the roster is flipped to inactive so
 * admin reporting can see they were removed, not merely never seen.
 */
export async function isRosterSignInAllowed(db: Db, email: string, now: Date = new Date()): Promise<boolean> {
	const normalized = normalizeEmail(email);
	const [existing] = await db.select({ id: members.id }).from(members).where(eq(members.email, normalized)).limit(1);

	if (existing && (await isMemberSuperAdmin(db, existing.id))) return true;

	const termId = await getCurrentTermId(db, now);
	if (!termId) {
		if (existing) await deactivateMemberByEmail(db, normalized);
		return false;
	}

	const onRoster = await isEmailOnRoster(db, termId, normalized);
	if (!onRoster) {
		if (existing) await deactivateMemberByEmail(db, normalized);
		return false;
	}

	return true;
}
