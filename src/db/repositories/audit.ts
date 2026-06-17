import type { Actor } from "@/server/auth/permissions";

export type AuditRecordInput = {
	action: string;
	targetType: string;
	targetId: string;
	category: "role" | "event" | "content" | "survey" | "link" | "member";
	detail?: string | null;
};

export type AuditRepository = {
	record(actor: Actor, input: AuditRecordInput): Promise<void>;
};

export function createAuditRepository(): AuditRepository {
	return {
		async record() {
			return;
		},
	};
}
