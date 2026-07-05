"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";

// Server actions get Next's built-in same-origin/POST protection (same as every
// other mutation action in this app, e.g. members/list/actions.ts).

const createSchema = z
	.object({
		title: z.string().trim().min(1, "Add a title.").max(160),
		type: z.enum(["official", "casual", "birthday"]),
		place: z.string().trim().min(1, "Add a place.").max(160),
		description: z.string().trim().min(1, "Add a description.").max(4000),
		startsAt: z.coerce.date(),
		endsAt: z.coerce.date(),
		capacity: z.number().int().min(1).max(100000).nullable().default(null),
	})
	.refine((v) => v.endsAt > v.startsAt, { path: ["endsAt"], message: "End must be after the start." });

export async function createEventAction(input: z.input<typeof createSchema>) {
	const actor = await requireActor();
	const parsed = createSchema.parse(input);
	const repositories = await getRepositories();
	// points stays null on create — only Events-role CRS admins set the value (spec §4).
	const event = await repositories.events.create(actor, { ...parsed, points: null });
	revalidatePath("/portal/calendar");
	return { id: event.id };
}
