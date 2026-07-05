"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { can, normalizeRoleKeys } from "@/server/auth/permissions";

// Server actions get Next's built-in same-origin/POST protection (same as every
// other mutation action in this app, e.g. members/list/actions.ts).

const saveSchema = z.object({
	memberId: z.string().min(1),
	baseVersion: z.string(),
	desiredRoleKeys: z.array(z.string()).transform(normalizeRoleKeys).default([]),
});

export async function searchMembersAction(query: string) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	return repositories.members.search(actor, query);
}

export async function loadMemberRolesAction(memberId: string) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	const keys = await repositories.roles.getMemberRoleKeys(actor, memberId);
	return { roleKeys: keys, baseVersion: repositories.roles.baseVersionOf(keys) };
}

export async function saveMemberRolesAction(input: z.input<typeof saveSchema>) {
	const actor = await requireActor();
	if (!can(actor, "role:assign")) throw new Error("Not authorized to assign roles.");
	const parsed = saveSchema.parse(input);
	const repositories = await getRepositories();
	const result = await repositories.roles.saveMemberRoles(actor, parsed);
	revalidatePath("/portal/admin/members/roles");
	return { roleKeys: result.roleKeys, baseVersion: repositories.roles.baseVersionOf(result.roleKeys) };
}
