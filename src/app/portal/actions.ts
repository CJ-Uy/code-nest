"use server";

import { signOut } from "@/auth";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";

export async function signOutAction(): Promise<void> {
	await signOut({ redirectTo: "/" });
}

export async function markTourSeenAction(): Promise<void> {
	const actor = await requireActor();
	const repositories = await getRepositories();
	await repositories.memberFeed.markTourSeen(actor);
}
