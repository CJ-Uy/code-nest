import { z } from "zod";
import type { PointTypeUpsertInput } from "@/db/repositories/pointTypes";

const optionalIdSchema = z.union([z.literal(""), z.string().regex(/^pt_[a-z0-9_]+$/)]);
const keySchema = z.string().trim().min(1).max(40).regex(/^[a-z0-9_]+$/);
const labelSchema = z.string().trim().min(1).max(60);
const positionSchema = z.coerce.number().int().min(0).max(999);

export function parsePointTypeUpsertInput(formData: FormData): PointTypeUpsertInput {
	const id = optionalIdSchema.parse(formData.get("id") ?? "");
	return {
		id: id === "" ? null : id,
		key: keySchema.parse(formData.get("key")),
		label: labelSchema.parse(formData.get("label")),
		countsTowardRetention: formData.get("countsTowardRetention") === "on",
		active: formData.get("active") === "on",
		position: positionSchema.parse(formData.get("position") ?? 0),
	};
}
