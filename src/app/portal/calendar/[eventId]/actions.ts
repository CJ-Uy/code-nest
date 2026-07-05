"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";

// Server actions get Next's built-in same-origin/POST protection (same as the
// other mutation actions in this app, e.g. members/list/actions.ts).

function revalidate(eventId: string) {
	revalidatePath(`/portal/calendar/${eventId}`);
	revalidatePath("/portal/calendar");
}

const updateSchema = z
	.object({
		eventId: z.string().min(1),
		title: z.string().trim().min(1).max(160),
		type: z.enum(["official", "casual", "birthday"]),
		place: z.string().trim().min(1).max(160),
		description: z.string().trim().min(1).max(4000),
		startsAt: z.coerce.date(),
		endsAt: z.coerce.date(),
		capacity: z.number().int().min(1).max(100000).nullable().default(null),
	})
	.refine((v) => v.endsAt > v.startsAt, { path: ["endsAt"], message: "End must be after the start." });

export async function updateEventAction(input: z.input<typeof updateSchema>) {
	const actor = await requireActor();
	const { eventId, ...patch } = updateSchema.parse(input);
	const repositories = await getRepositories();
	await repositories.events.update(actor, eventId, patch);
	revalidate(eventId);
}

export async function deleteEventAction(eventId: string) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	await repositories.events.softDelete(actor, eventId);
	revalidatePath("/portal/calendar");
}

export async function searchMembersAction(eventId: string, query: string) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	return repositories.events.searchAttendableMembers(actor, { eventId, query });
}

export async function markPresentAction(eventId: string, memberId: string) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	// Points attach to a term; resolve the active one server-side so the client can't set it.
	const terms = await repositories.retention.listTerms(actor).catch(() => []);
	const currentTerm = terms.find((t) => t.isCurrent) ?? terms[0];
	if (!currentTerm) throw new Error("No active school year to record attendance against.");
	const result = await repositories.events.recordScan(actor, { eventId, memberId, termId: currentTerm.id });
	revalidate(eventId);
	return result;
}

const staffRole = z.enum(["admin", "scanner"]);

export async function addStaffAction(eventId: string, memberId: string, role: z.infer<typeof staffRole>) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	await repositories.events.addStaff(actor, eventId, memberId, staffRole.parse(role));
	revalidate(eventId);
}

export async function removeStaffAction(eventId: string, memberId: string) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	await repositories.events.removeStaff(actor, eventId, memberId);
	revalidate(eventId);
}

export async function transferOwnershipAction(eventId: string, toMemberId: string) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	await repositories.events.transferOwnership(actor, eventId, toMemberId);
	revalidate(eventId);
}

export async function inviteAction(eventId: string, memberIds: string[]) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	const result = await repositories.events.invite(actor, eventId, memberIds);
	revalidate(eventId);
	return result;
}

export async function setPointsAction(eventId: string, points: number | null) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	const result = await repositories.events.setPoints(actor, eventId, points);
	revalidate(eventId);
	return result;
}
