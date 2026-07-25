import { eventTypeRules, eventTypes } from "@/db/schema";
import type { EventType } from "@/db/schema";
import type { Actor, PermissionAction } from "@/server/auth/permissions";
import { can, permissionActions } from "@/server/auth/permissions";
import type { AuditRepository } from "./audit";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

export type EventTypeRule = { type: EventType; requiredPermission: PermissionAction | null };

export type EventTypeRulesRepository = {
	list(): Promise<EventTypeRule[]>;
	setRequiredPermission(actor: Actor, type: EventType, permission: PermissionAction | null): Promise<void>;
};

/** A type with no rule row falls open — a missing row must never lock members out. */
export function canCreateType(actor: Actor, rules: EventTypeRule[], type: EventType): boolean {
	const rule = rules.find((entry) => entry.type === type);
	if (!rule || rule.requiredPermission === null) return true;
	return can(actor, rule.requiredPermission);
}

export function allowedEventTypes(actor: Actor, rules: EventTypeRule[]): EventType[] {
	return eventTypes.filter((type) => canCreateType(actor, rules, type));
}

function normalize(row: { type: string; requiredPermission: string | null }): EventTypeRule {
	const permission = row.requiredPermission;
	return {
		type: row.type as EventType,
		requiredPermission:
			permission && (permissionActions as readonly string[]).includes(permission) ? (permission as PermissionAction) : null,
	};
}

export function createEventTypeRulesRepository(db: Db, audit: AuditRepository): EventTypeRulesRepository {
	return {
		async list() {
			const rows = await db
				.select({ type: eventTypeRules.type, requiredPermission: eventTypeRules.requiredPermission })
				.from(eventTypeRules);
			return rows.map(normalize);
		},

		async setRequiredPermission(actor, type, permission) {
			if (!can(actor, "role:assign")) throw new Error("Not authorized to change event type rules.");
			if (!(eventTypes as readonly string[]).includes(type)) throw new Error("Unknown event type.");
			if (permission !== null && !(permissionActions as readonly string[]).includes(permission)) {
				throw new Error("Unknown permission.");
			}
			await db
				.insert(eventTypeRules)
				.values({ type, requiredPermission: permission, updatedBy: actor.memberId, updatedAt: new Date() })
				.onConflictDoUpdate({
					target: eventTypeRules.type,
					set: { requiredPermission: permission, updatedBy: actor.memberId, updatedAt: new Date() },
				});
			await audit.record(actor, {
				action: "event:set_type_rule",
				targetType: "event_type",
				targetId: type,
				category: "event",
				detail: `required=${permission ?? "none"}`,
			});
		},
	};
}
