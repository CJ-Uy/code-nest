import { and, eq, like, or } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { members } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { CreateMemberInput, Member, UpdateMemberProfileInput } from "../types";
import type { AuditRepository } from "./audit";

type MemberInsert = InferInsertModel<typeof members>;

export type MemberDb = {
	select(): {
		from(table: typeof members): {
			orderBy(column: typeof members.createdAt): { limit(limit: number): Promise<Member[]> | Member[] };
			where(condition: unknown): { limit(limit: number): Promise<Member[]> | Member[] };
		};
	};
	insert(table: typeof members): {
		values(value: MemberInsert): {
			returning(): Promise<Member[]> | Member[];
		};
	};
	update(table: typeof members): {
		set(value: Partial<MemberInsert>): {
			where(condition: unknown): {
				returning(): Promise<Member[]> | Member[];
			};
		};
	};
};

export type MembersRepository = {
	list(actor: Actor, input?: { limit?: number }): Promise<Member[]>;
	search(actor: Actor, query: string): Promise<Member[]>;
	getById(actor: Actor, id: string): Promise<Member | null>;
	create(actor: Actor, input: CreateMemberInput): Promise<Member>;
	updateProfile(actor: Actor, id: string, input: UpdateMemberProfileInput): Promise<Member>;
};

export function createMembersRepository(db: MemberDb, audit: AuditRepository): MembersRepository {
	return {
		async list(actor, input) {
			if (!can(actor, "member:manage")) {
				throw new Error("Not authorized to list members.");
			}
			return db.select().from(members).orderBy(members.createdAt).limit(Math.min(input?.limit ?? 25, 50));
		},
		async search(actor, query) {
			// Roles page authorizes on its own permission; member management also allowed.
			if (!can(actor, "role:assign") && !can(actor, "member:manage")) {
				throw new Error("Not authorized to search members.");
			}
			const q = query.trim().toLowerCase();
			if (q.length < 2) return [];
			const pattern = `%${q}%`;
			// SQLite LIKE is case-insensitive for ASCII; active members only, capped at 20.
			return db
				.select()
				.from(members)
				.where(
					and(
						eq(members.status, "active"),
						or(
							like(members.name, pattern),
							like(members.fullName, pattern),
							like(members.nickname, pattern),
							like(members.email, pattern),
						),
					),
				)
				.limit(20);
		},
		async getById(actor, id) {
			if (actor.memberId !== id && !can(actor, "member:manage")) {
				throw new Error("Not authorized to read this member.");
			}
			const [member] = await db.select().from(members).where(eq(members.id, id)).limit(1);
			return member ?? null;
		},
		async create(actor, input) {
			if (!can(actor, "member:manage")) {
				throw new Error("Not authorized to create members.");
			}
			const email = input.email.trim().toLowerCase();
			const [existing] = await db.select().from(members).where(eq(members.email, email)).limit(1);
			if (existing) return existing;
			const [member] = await db.insert(members).values({ id: createId("mem"), email, name: input.name ?? null }).returning();
			await audit.record(actor, {
				action: "member:create",
				targetType: "member",
				targetId: member.id,
				category: "member",
			});
			return member;
		},
		async updateProfile(actor, id, input) {
			if (actor.memberId !== id && !can(actor, "member:manage")) {
				throw new Error("Not authorized to update this member.");
			}
			const [member] = await db
				.update(members)
				.set({ ...input, updatedAt: new Date() })
				.where(eq(members.id, id))
				.returning();
			if (!member) {
				throw new Error("Member not found.");
			}
			await audit.record(actor, {
				action: "member:profile_update",
				targetType: "member",
				targetId: member.id,
				category: "member",
			});
			return member;
		},
	};
}
