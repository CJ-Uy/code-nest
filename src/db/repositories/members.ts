import { eq } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";
import { createId } from "@/lib/ids";
import { members } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { CreateMemberInput, Member } from "../types";
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
};

export type MembersRepository = {
	list(actor: Actor, input?: { limit?: number }): Promise<Member[]>;
	getById(actor: Actor, id: string): Promise<Member | null>;
	create(actor: Actor, input: CreateMemberInput): Promise<Member>;
};

export function createMembersRepository(db: MemberDb, audit: AuditRepository): MembersRepository {
	return {
		async list(actor, input) {
			if (!can(actor, "member:manage")) {
				throw new Error("Not authorized to list members.");
			}
			return db.select().from(members).orderBy(members.createdAt).limit(Math.min(input?.limit ?? 25, 50));
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
			const [member] = await db.insert(members).values({ id: createId("mem"), email: input.email, name: input.name ?? null }).returning();
			await audit.record(actor, {
				action: "member:create",
				targetType: "member",
				targetId: member.id,
				category: "member",
			});
			return member;
		},
	};
}
