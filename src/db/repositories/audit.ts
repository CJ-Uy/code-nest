import type { Actor } from "@/server/auth/permissions";
import type { InferInsertModel } from "drizzle-orm";
import { auditLogs } from "@/db/schema";
import { createId } from "@/lib/ids";

export type AuditRecordInput = {
	action: string;
	targetType: string;
	targetId: string;
	category: "role" | "event" | "retention" | "survey" | "link" | "member" | "announcement" | "library";
	detail?: string | null;
};

export type AuditRepository = {
	record(actor: Actor, input: AuditRecordInput): Promise<void>;
};

type AuditInsert = InferInsertModel<typeof auditLogs>;

export type AuditDb = {
	insert(table: typeof auditLogs): {
		values(value: AuditInsert): Promise<unknown> | { then: Promise<unknown>["then"] };
	};
};

export function createAuditRepository(db: AuditDb): AuditRepository {
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
			});
		},
	};
}

export function createUnavailableAuditRepository(): AuditRepository {
	return {
		async record() {
			throw new Error("Audit writes are unavailable through this repository adapter.");
		},
	};
}
