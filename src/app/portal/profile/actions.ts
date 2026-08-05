"use server";

import { revalidatePath } from "next/cache";
import { getRepositories } from "@/db";
import { updateMemberProfileInputSchema } from "@/db/types";
import { requireActor } from "@/server/auth/actor";

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

export async function updateProfileAction(
	_prev: UpdateProfileResult | null,
	formData: FormData,
): Promise<UpdateProfileResult> {
	const actor = await requireActor();

	const parsed = updateMemberProfileInputSchema.safeParse({
		fullName: nullableText(formData.get("fullName")),
		nickname: nullableText(formData.get("nickname")),
		pronouns: nullableText(formData.get("pronouns")),
		batch: nullableText(formData.get("batch")),
		birthday: nullableText(formData.get("birthday")),
		// Birthdays a member fills in are public on the calendar; no opt-out in the form.
		birthdayPrivate: false,
	});
	if (!parsed.success) {
		return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid profile details." };
	}

	try {
		const repositories = await getRepositories();
		await repositories.members.updateProfile(actor, actor.memberId, parsed.data);
		revalidatePath("/portal/profile");
		return { ok: true };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to save your profile.";
		return { ok: false, error: message };
	}
}

function nullableText(value: FormDataEntryValue | null): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed || null;
}
