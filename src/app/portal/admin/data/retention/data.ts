import { asc, desc, eq, inArray, isNull } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { crsAttendance, crsEvents, members, pointTypes, terms } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { MemberOption } from "./member-checklist";

export async function loadRetentionPickers(actor: Actor): Promise<{
	members: MemberOption[];
	terms: { id: string; label: string; startsAt: Date; endsAt: Date }[];
	events: { id: string; label: string; detail: string; startsAt: Date; status: string; type: string; place: string }[];
	pointTypes: { id: string; key: string; label: string }[];
}> {
	if (!can(actor, "retention:record")) {
		throw new Error("Not authorized to load retention pickers.");
	}
	const db = getDb() as unknown as DrizzleD1Database<typeof schema>;

	const memberRows = await db
		.select({ id: members.id, name: members.name, fullName: members.fullName, email: members.email })
		.from(members)
		.where(inArray(members.status, ["active", "pending"]))
		.orderBy(members.email)
		.limit(500);

	const termRows = await db
		.select({ id: terms.id, name: terms.name, startsAt: terms.startsAt, endsAt: terms.endsAt })
		.from(terms)
		.orderBy(desc(terms.startsAt))
		.limit(50);

	const eventRows = await db
		.select({
			id: crsEvents.id,
			title: crsEvents.title,
			startsAt: crsEvents.startsAt,
			status: crsEvents.status,
			type: crsEvents.type,
			place: crsEvents.place,
		})
		.from(crsEvents)
		.where(isNull(crsEvents.deletedAt))
		.orderBy(desc(crsEvents.startsAt))
		.limit(200);

	const pointTypeRows = await db
		.select({ id: pointTypes.id, key: pointTypes.key, label: pointTypes.label })
		.from(pointTypes)
		.where(eq(pointTypes.active, true))
		.orderBy(asc(pointTypes.position), asc(pointTypes.label));

	return {
		members: memberRows.map((row) => ({
			id: row.id,
			label: row.fullName ?? row.name ?? row.email,
			sublabel: row.email,
		})),
		terms: termRows.map((row) => ({ id: row.id, label: row.name, startsAt: row.startsAt, endsAt: row.endsAt })),
		events: eventRows.map((row) => ({
			id: row.id,
			label: row.title,
			detail: `${row.startsAt.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} · ${row.place}`,
			startsAt: row.startsAt,
			status: row.status,
			type: row.type,
			place: row.place,
		})),
		pointTypes: pointTypeRows,
	};
}

export async function loadAttendance(
	actor: Actor,
	eventIds: string[],
): Promise<{ eventId: string; memberId: string; memberName: string | null; memberEmail: string; scannedAt: Date }[]> {
	if (!can(actor, "retention:record")) throw new Error("Not authorized to load attendance.");
	if (eventIds.length === 0) return [];
	const db = getDb() as unknown as DrizzleD1Database<typeof schema>;
	return db
		.select({
			eventId: crsAttendance.eventId,
			memberId: crsAttendance.memberId,
			memberName: members.fullName,
			memberEmail: members.email,
			scannedAt: crsAttendance.scannedAt,
		})
		.from(crsAttendance)
		.innerJoin(members, eq(members.id, crsAttendance.memberId))
		.where(inArray(crsAttendance.eventId, eventIds))
		.orderBy(desc(crsAttendance.scannedAt));
}
