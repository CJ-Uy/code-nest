"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { parsePointTypeUpsertInput } from "./input";

export async function upsertPointTypeAction(formData: FormData) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	await repositories.pointTypes.upsertType(actor, parsePointTypeUpsertInput(formData));
	revalidatePath("/portal", "layout");
}
