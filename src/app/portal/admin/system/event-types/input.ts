import { z } from "zod";
import type { EventType } from "@/db/schema";
import { eventTypes } from "@/db/schema";

export type EventTypeRuleInput = {
	type: EventType;
	requiredPermission: string | null;
};

const typeSchema = z.enum(eventTypes);

/**
 * Parses the event-type-rule form submission out of the server action so it can be unit
 * tested (server actions themselves aren't callable in this test harness).
 *
 * `requiredPermission` must be handled as three distinct cases, not two:
 * - absent from the FormData entirely -> throw. This must never be coerced to "any member".
 *   It's reachable in practice: a <select> can hold a "selected" <option> whose value is
 *   still dropped from the submitted FormData (e.g. a disabled option, per the HTML
 *   form-data-set construction algorithm), so "the field is present" can't be assumed just
 *   because the UI showed a value.
 * - present and exactly "" -> null ("Any member"). This is the ONLY way to open a type up.
 * - present with any other string -> passed through unchanged, unvalidated here.
 *   `setRequiredPermission` (src/db/repositories/eventTypeRules.ts) already validates it
 *   against `permissionActions` and throws "Unknown permission." for anything unrecognized.
 *   Resubmitting a row that already holds an unrecognized permission therefore fails loudly
 *   and safely instead of silently opening the type.
 */
export function parseEventTypeRuleInput(formData: FormData): EventTypeRuleInput {
	const type = typeSchema.parse(formData.get("type"));

	const rawPermission = formData.get("requiredPermission");
	if (rawPermission === null) {
		throw new Error("Missing requiredPermission field.");
	}
	if (typeof rawPermission !== "string") {
		throw new Error("Invalid requiredPermission field.");
	}

	return { type, requiredPermission: rawPermission === "" ? null : rawPermission };
}
