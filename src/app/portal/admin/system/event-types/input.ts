import { z } from "zod";
import type { EventTypeUpsertInput } from "@/db/repositories/eventTypeRules";
import { eventTypeColours } from "@/lib/event-type-colours";
import { eventTypeKeySchema } from "@/lib/event-type-key";

const labelSchema = z.string().trim().min(1).max(60);
const colourSchema = z.enum(eventTypeColours);
const positionSchema = z.coerce.number().int().min(0).max(999);

export function parseEventTypeUpsertInput(formData: FormData): EventTypeUpsertInput {
	const raw = formData.get("requiredPermission");
	if (raw === null) throw new Error("Missing requiredPermission field.");
	if (typeof raw !== "string") throw new Error("Invalid requiredPermission field.");

	return {
		type: eventTypeKeySchema.parse(formData.get("type")),
		label: labelSchema.parse(formData.get("label")),
		colour: colourSchema.parse(formData.get("colour")),
		requiredPermission: raw === "" ? null : raw,
		active: formData.get("active") === "on",
		position: positionSchema.parse(formData.get("position") ?? 0),
	};
}
