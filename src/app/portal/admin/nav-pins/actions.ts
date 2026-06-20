"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";

const pinSchema = z.object({
	label: z.string().trim().min(1).max(80),
	url: z.string().trim().url().refine((value) => /^https?:\/\//.test(value), "URL must be http or https."),
	icon: z.string().trim().min(1).max(40),
	position: z.coerce.number().int().min(0).max(999),
});

function parsePin(formData: FormData) {
	return pinSchema.parse({
		label: formData.get("label"),
		url: formData.get("url"),
		icon: formData.get("icon"),
		position: formData.get("position"),
	});
}

export async function createNavPinAction(formData: FormData) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	await repositories.navPins.create(actor, parsePin(formData));
	revalidatePath("/portal/admin/nav-pins");
}

export async function updateNavPinAction(formData: FormData) {
	const actor = await requireActor();
	const id = z.string().min(1).parse(formData.get("id"));
	const repositories = await getRepositories();
	await repositories.navPins.update(actor, id, parsePin(formData));
	revalidatePath("/portal/admin/nav-pins");
}

export async function deleteNavPinAction(formData: FormData) {
	const actor = await requireActor();
	const id = z.string().min(1).parse(formData.get("id"));
	const repositories = await getRepositories();
	await repositories.navPins.remove(actor, id);
	revalidatePath("/portal/admin/nav-pins");
}
