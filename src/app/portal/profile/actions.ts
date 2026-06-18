"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/db";
import { updateMemberProfileInputSchema } from "@/db/types";
import { requireActor } from "@/server/auth/actor";

export async function updateProfileAction(formData: FormData) {
	const actor = await requireActor();
	const input = updateMemberProfileInputSchema.parse({
		fullName: nullableText(formData.get("fullName")),
		nickname: nullableText(formData.get("nickname")),
		pronouns: nullableText(formData.get("pronouns")),
		batch: nullableText(formData.get("batch")),
		birthday: nullableText(formData.get("birthday")),
		birthdayPrivate: formData.get("birthdayPrivate") === "on",
	});
	const repositories = await getRepositories();
	await repositories.members.updateProfile(actor, actor.memberId, input);
	revalidatePath("/portal/profile");
}

function nullableText(value: FormDataEntryValue | null): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed || null;
}
