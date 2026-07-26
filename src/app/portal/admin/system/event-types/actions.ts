"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import type { PermissionAction } from "@/server/auth/permissions";
import { parseEventTypeRuleInput } from "./input";

export async function setEventTypeRuleAction(formData: FormData) {
	const actor = await requireActor();
	const input = parseEventTypeRuleInput(formData);
	const repositories = await getRepositories();
	// `input.requiredPermission` is deliberately unvalidated string | null here (see input.ts).
	// setRequiredPermission validates it against permissionActions itself and throws "Unknown
	// permission." for anything unrecognized, so this cast doesn't widen what's actually
	// accepted — it just lets that repository-side check run instead of a second one here
	// short-circuiting an unrecognized value back to "any member".
	await repositories.eventTypeRules.setRequiredPermission(
		actor,
		input.type,
		input.requiredPermission as PermissionAction | null,
	);
	revalidatePath("/portal/admin/system/event-types");
	revalidatePath("/portal/calendar");
}
