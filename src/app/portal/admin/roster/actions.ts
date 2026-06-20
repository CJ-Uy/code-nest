"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";

const addSchema = z.object({
	termId: z.string().min(1),
	email: z.string().trim().toLowerCase().email(),
});

const removeSchema = z.object({
	termId: z.string().min(1),
	email: z.string().min(1),
});

export async function addRosterEntryAction(formData: FormData) {
	const actor = await requireActor();
	const input = addSchema.parse({ termId: formData.get("termId"), email: formData.get("email") });
	const repositories = await getRepositories();
	await repositories.roster.add(actor, input);
	revalidatePath("/portal/admin/roster");
}

export async function removeRosterEntryAction(formData: FormData) {
	const actor = await requireActor();
	const input = removeSchema.parse({ termId: formData.get("termId"), email: formData.get("email") });
	const repositories = await getRepositories();
	await repositories.roster.remove(actor, input.termId, input.email);
	revalidatePath("/portal/admin/roster");
}
