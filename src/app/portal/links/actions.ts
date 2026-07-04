"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";

export async function createLinkAction(formData: FormData): Promise<void> {
	const actor = await requireActor();
	const { links } = await getRepositories();
	await links.create(actor, {
		slug: String(formData.get("slug") ?? ""),
		destinationUrl: String(formData.get("destinationUrl") ?? ""),
		title: String(formData.get("title") ?? ""),
	});
	revalidatePath("/portal/links");
}
