"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db";
import { eventTypes } from "@/db/schema";
import { requireActor } from "@/server/auth/actor";
import { permissionActions } from "@/server/auth/permissions";

// "" is the form's representation of "any member may create this type".
const schema = z.object({
	type: z.enum(eventTypes),
	requiredPermission: z
		.union([z.enum(permissionActions), z.literal("")])
		.transform((value) => (value === "" ? null : value)),
});

export async function setEventTypeRuleAction(formData: FormData) {
	const actor = await requireActor();
	const input = schema.parse({
		type: formData.get("type"),
		requiredPermission: formData.get("requiredPermission") ?? "",
	});
	const repositories = await getRepositories();
	await repositories.eventTypeRules.setRequiredPermission(actor, input.type, input.requiredPermission);
	revalidatePath("/portal/admin/system/event-types");
	revalidatePath("/portal/calendar");
}
