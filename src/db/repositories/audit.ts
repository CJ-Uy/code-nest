import { desc, eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { auditLogs } from "@/db/schema";
import { createId } from "@/lib/ids";
import type { Actor } from "@/server/auth/permissions";
import { hasAnyAdminScope } from "@/server/auth/admin";
import type * as schema from "../schema";

export type AuditCategory =
	| "role"
	| "event"
	| "retention"
	| "survey"
	| "link"
	| "member"
	| "announcement"
	| "library";

export type AuditRecordInput = {
	action: string;
	targetType: string;
	targetId: string;
	category: AuditCategory;
	detail?: string | null;
};

export type AuditEntry = InferSelectModel<typeof auditLogs>;

export type AuditRepository = {
	record(actor: Actor, input: AuditRecordInput): Promise<void>;
	list(actor: Actor, options?: { category?: AuditCategory; limit?: number }): Promise<AuditEntry[]>;
};

type AuditInsert = InferInsertModel<typeof auditLogs>;
type Db = DrizzleD1Database<typeof schema>;

// Minimal structural handle other repositories intersect with their own db
// cast when they record audit entries directly.
export type AuditDb = {
	insert(table: typeof auditLogs): {
		values(value: AuditInsert): Promise<unknown> | { then: Promise<unknown>["then"] };
	};
};

export function createAuditRepository(db: Db): AuditRepository {
	return {
		async record(actor, input) {
			await db.insert(auditLogs).values({
				id: createId("aud"),
				actorMemberId: actor.memberId,
				actorContext: actor.context ?? "session",
				sharedTokenHash: actor.sharedTokenHash ?? null,
				sharedTokenLabel: actor.sharedTokenLabel ?? null,
				action: input.action,
				targetType: input.targetType,
				targetId: input.targetId,
				detail: input.detail ?? null,
				category: input.category,
			} satisfies AuditInsert);
		},
		async list(actor, options) {
			if (!hasAnyAdminScope(actor)) {
				throw new Error("Not authorized to view the audit log.");
			}
			const limit = options?.limit ?? 100;
			if (options?.category) {
				return db
					.select()
					.from(auditLogs)
					.where(eq(auditLogs.category, options.category))
					.orderBy(desc(auditLogs.createdAt))
					.limit(limit);
			}
			return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
		},
	};
}

export function createUnavailableAuditRepository(): AuditRepository {
	const unavailable = () => {
		throw new Error("Audit writes are unavailable through this repository adapter.");
	};
	return {
		record: unavailable,
		list: unavailable,
	};
}
