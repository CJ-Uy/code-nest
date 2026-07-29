"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { parsePointTypeRows, parsePointTypeUpsertInput } from "./input";

export async function upsertPointTypeAction(formData: FormData) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	await repositories.pointTypes.upsertType(actor, parsePointTypeUpsertInput(formData));
	revalidatePath("/portal", "layout");
}

export async function savePointTypesAction(formData: FormData) {
	const actor = await requireActor();
	const inputs = parsePointTypeRows(formData);
	const repositories = await getRepositories();
	const retentionTypes = inputs.filter((input) => input.active && input.countsTowardRetention);
	const otherTypes = inputs.filter((input) => !retentionTypes.includes(input));
	for (const input of [...retentionTypes, ...otherTypes]) {
		await repositories.pointTypes.upsertType(actor, input);
	}
	revalidatePath("/portal", "layout");
}
