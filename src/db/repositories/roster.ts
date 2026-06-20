import { and, asc, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { members, termMemberRoster } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { AuditRepository } from "./audit";

export type RosterEntry = InferSelectModel<typeof termMemberRoster>;

export type RosterAddInput = {
	termId: string;
	email: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RosterDb = any;

export type RosterRepository = {
	listForTerm(actor: Actor, termId: string): Promise<RosterEntry[]>;
	add(actor: Actor, input: RosterAddInput): Promise<RosterEntry>;
	remove(actor: Actor, termId: string, email: string): Promise<void>;
};

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function createRosterRepository(db: RosterDb, audit: AuditRepository): RosterRepository {
	return {
		async listForTerm(actor, termId) {
			if (!can(actor, "roster:manage")) {
				throw new Error("Not authorized to list the roster.");
			}
			return db
				.select()
				.from(termMemberRoster)
				.where(eq(termMemberRoster.termId, termId))
				.orderBy(asc(termMemberRoster.email));
		},
		async add(actor, input) {
			if (!can(actor, "roster:manage")) {
				throw new Error("Not authorized to edit the roster.");
			}
			const email = normalizeEmail(input.email);
			const [existingMember] = await db.select({ id: members.id }).from(members).where(eq(members.email, email)).limit(1);
			await db
				.insert(termMemberRoster)
				.values({ termId: input.termId, email, memberId: existingMember?.id ?? null, addedBy: actor.memberId })
				.onConflictDoNothing();
			await audit.record(actor, {
				action: "roster:add",
				targetType: "term_member_roster",
				targetId: `${input.termId}:${email}`,
				category: "retention",
			});
			const [entry] = await db
				.select()
				.from(termMemberRoster)
				.where(and(eq(termMemberRoster.termId, input.termId), eq(termMemberRoster.email, email)))
				.orderBy(asc(termMemberRoster.email));
			return entry;
		},
		async remove(actor, termId, email) {
			if (!can(actor, "roster:manage")) {
				throw new Error("Not authorized to edit the roster.");
			}
			const normalized = normalizeEmail(email);
			await db
				.delete(termMemberRoster)
				.where(and(eq(termMemberRoster.termId, termId), eq(termMemberRoster.email, normalized)));
			await audit.record(actor, {
				action: "roster:remove",
				targetType: "term_member_roster",
				targetId: `${termId}:${normalized}`,
				category: "retention",
			});
		},
	};
}
