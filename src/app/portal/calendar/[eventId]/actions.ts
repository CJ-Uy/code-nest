"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getRepositories } from "@/db";
import { eventsContract } from "@/db/contract/events";
import { eventTypeKeySchema } from "@/lib/event-type-key";
import { eventSignupAnswersSchema, eventSignupFormInputSchema } from "@/lib/event-signup-form";
import { requireActor } from "@/server/auth/actor";
import { endOfUtc8Day, startOfUtc8Day } from "@/lib/date-slots";

// Server actions get Next's built-in same-origin/POST protection (same as the
// other mutation actions in this app, e.g. members/list/actions.ts).

function revalidate(eventId: string) {
	revalidatePath(`/portal/calendar/${eventId}`);
	revalidatePath("/portal/calendar");
	revalidatePath("/portal/events");
}

const updateSchema = z
	.object({
		eventId: z.string().min(1),
		title: z.string().trim().min(1).max(160),
		type: eventTypeKeySchema,
		place: z.string().trim().min(1).max(160),
		description: z.string().trim().min(1).max(4000),
		startsAt: z.coerce.date(),
		endsAt: z.coerce.date(),
		capacity: z.number().int().min(1).max(100000).nullable().default(null),
		graceMinutes: z.number().int().min(0).max(240).nullable().default(null),
		rsvpForm: eventSignupFormInputSchema.default([]),
		rsvpResponsesPublic: z.boolean().default(false),
		allDay: z.boolean().default(false),
		readOnly: z.boolean().default(false),
	})
	// Normalized before the ordering check so a same-day all-day event stays valid.
	.transform((v) =>
		v.allDay ? { ...v, startsAt: startOfUtc8Day(v.startsAt), endsAt: endOfUtc8Day(v.endsAt) } : v,
	)
	.refine((v) => v.endsAt > v.startsAt, { path: ["endsAt"], message: "End must be after the start." });

/**
 * Toggling an existing event to informational and back. Separate from updateEventAction so a
 * mis-set event can be repaired without resubmitting the whole form.
 *
 * Authorization is NOT decided here: events.update checks the readOnly field against event:moderate
 * independently of ownership, which is also what protects the HTTP routes.
 */
export async function setEventReadOnlyAction(input: { eventId: string; readOnly: boolean }) {
	const actor = await requireActor();
	const parsed = z.object({ eventId: z.string().min(1), readOnly: z.boolean() }).parse(input);
	const repositories = await getRepositories();
	await repositories.events.update(actor, parsed.eventId, { readOnly: parsed.readOnly });
	revalidate(parsed.eventId);
}

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
	const currentTerm = terms.find((t) => t.isCurrent);
	if (!currentTerm) throw new Error("No active school year to record attendance against.");
	const result = await repositories.events.recordScan(actor, { eventId, memberId, termId: currentTerm.id });
	revalidate(eventId);
	return result;
}

export async function rsvpAction(eventId: string, state: "going" | "none", answers: unknown) {
	const actor = await requireActor();
	const input = eventsContract.rsvp.input.parse({
		eventId,
		state,
		answers: eventSignupAnswersSchema.parse(answers),
	});
	const repositories = await getRepositories();
	const result = await repositories.events.setRsvp(actor, input);
	revalidate(input.eventId);
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

export async function setAwardsAction(eventId: string, awards: unknown) {
	const actor = await requireActor();
	const input = eventsContract.setAwards.input.parse({ eventId, awards });
	const repositories = await getRepositories();
	const result = await repositories.events.setAwards(actor, input.eventId, input.awards);
	revalidate(input.eventId);
	return result;
}

export async function removeRetiredAwardAction(eventId: string, pointTypeId: string) {
	const actor = await requireActor();
	const repositories = await getRepositories();
	const result = await repositories.events.removeRetiredAward(actor, eventId, pointTypeId);
	revalidate(eventId);
	return result;
}
