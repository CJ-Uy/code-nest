import { desc, eq, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { crsEvents, members, terms } from "@/db/schema";
import type { Actor } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";
import type { MemberOption } from "./member-checklist";

export async function loadRetentionPickers(actor: Actor): Promise<{
	members: MemberOption[];
	terms: { id: string; label: string }[];
	events: { id: string; label: string }[];
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

	const termRows = await db.select({ id: terms.id, name: terms.name }).from(terms).orderBy(desc(terms.startsAt)).limit(50);

	const eventRows = await db
		.select({ id: crsEvents.id, title: crsEvents.title })
		.from(crsEvents)
		.where(eq(crsEvents.status, "approved"))
		.orderBy(desc(crsEvents.startsAt))
		.limit(200);

	return {
		members: memberRows.map((row) => ({
			id: row.id,
			label: row.fullName ?? row.name ?? row.email,
			sublabel: row.email,
		})),
		terms: termRows.map((row) => ({ id: row.id, label: row.name })),
		events: eventRows.map((row) => ({ id: row.id, label: row.title })),
	};
}
