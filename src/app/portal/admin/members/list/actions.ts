"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";

const inviteSchema = z.object({
	email: z.string().trim().toLowerCase().email(),
	name: z.string().trim().optional(),
});

const statusSchema = z.object({
	id: z.string().min(1),
	status: z.enum(["active", "pending", "inactive"]),
});

export async function inviteMemberAction(formData: FormData) {
	const actor = await requireActor();
	const input = inviteSchema.parse({ email: formData.get("email"), name: formData.get("name") });
	const repositories = await getRepositories();
	await repositories.members.create(actor, { email: input.email, name: input.name || null });
	revalidatePath("/portal/admin/members/list");
	revalidatePath("/portal/admin/members/roles");
}

export async function updateMemberStatusAction(formData: FormData) {
	const actor = await requireActor();
	const input = statusSchema.parse({ id: formData.get("id"), status: formData.get("status") });
	const repositories = await getRepositories();
	await repositories.members.updateStatus(actor, input.id, input.status);
	revalidatePath("/portal/admin/members/list");
}
