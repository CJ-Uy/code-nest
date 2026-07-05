"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db";
import { parseEmailColumn } from "@/lib/roster-emails";
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
	revalidatePath("/portal/admin/members/list");
}

export type BulkAddResult = { added: number; alreadyMembers: number; dedupedInput: number; invalid: string[] };

export async function bulkAddRosterAction(input: { termId: string; raw: string }): Promise<BulkAddResult> {
	const actor = await requireActor();
	const termId = z.string().min(1).parse(input.termId);
	const raw = z.string().max(64 * 1024, "Too much text pasted — split into smaller batches.").parse(input.raw);
	const { valid, invalid, dedupedInput } = parseEmailColumn(raw);
	if (valid.length > 500) {
		throw new Error("Too many emails (max 500 per submission). Split into smaller batches.");
	}
	const repositories = await getRepositories();
	const { added, alreadyMembers } = await repositories.roster.bulkAdd(actor, { termId, emails: valid });
	revalidatePath("/portal/admin/members/list");
	return { added, alreadyMembers, dedupedInput, invalid };
}

export async function removeRosterEntryAction(formData: FormData) {
	const actor = await requireActor();
	const input = removeSchema.parse({ termId: formData.get("termId"), email: formData.get("email") });
	const repositories = await getRepositories();
	await repositories.roster.remove(actor, input.termId, input.email);
	revalidatePath("/portal/admin/members/list");
}
