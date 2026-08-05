import { and, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
	crsAttendance,
	crsEvents,
	eventStaff,
	memberRoles,
	members,
	retentionRecords,
	roles,
	seedEventTypes,
	sessions,
	terms,
} from "@/db/schema";

const SEEDED = {
	"admin@example.com": { id: "mem_demo_admin", name: "Demo Admin", role: "super" },
	"member@example.com": { id: "mem_demo_member", name: "Demo Member", role: null },
} as const;

export async function POST(request: Request): Promise<Response> {
	if (process.env.APP_ENV !== "local" || process.env.E2E_AUTH_BYPASS !== "1") {
		return new Response("Not found", { status: 404 });
	}

	const { email } = (await request.json()) as { email?: string };
	if (!email) return new Response("email required", { status: 400 });

	const db = getDb();
	await ensureE2eData(db);
	let [member] = await db.select().from(members).where(eq(members.email, email)).limit(1);
	if (!member && email in SEEDED) {
		const seeded = SEEDED[email as keyof typeof SEEDED];
		// ponytail: local E2E self-seeds only auth actors when the sandbox blocks db:seed:local.
		await db
			.insert(members)
			.values({ id: seeded.id, email, name: seeded.name, fullName: seeded.name, status: "active" })
			.onConflictDoNothing();
		if (seeded.role) {
			await db
				.insert(roles)
				.values({ id: "role_super", key: "super", label: "Super admin", description: "Full portal access.", kind: "admin" })
				.onConflictDoNothing();
			await db
				.insert(memberRoles)
				.values({ memberId: seeded.id, roleId: "role_super", assignedBy: seeded.id })
				.onConflictDoNothing();
		}
		[member] = await db.select().from(members).where(eq(members.email, email)).limit(1);
	}
	if (!member) return new Response("seeded member not found", { status: 404 });

	const token = `e2e-${crypto.randomUUID()}`;
	const expires = new Date(Date.now() + 1000 * 60 * 60);
	await db.insert(sessions).values({ sessionToken: token, userId: member.id, expires });

	const headers = new Headers({ "content-type": "application/json" });
	headers.append("set-cookie", `authjs.session-token=${token}; Path=/; HttpOnly; SameSite=Lax`);
	return new Response(JSON.stringify({ ok: true }), { headers });
}

async function ensureE2eData(db: ReturnType<typeof getDb>): Promise<void> {
	const now = new Date();
	const termStartsAt = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
	const termEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
	const eventStartsAt = new Date(now.getTime() - 5 * 60 * 1000);
	const eventEndsAt = new Date(now.getTime() + 30 * 60 * 1000);
	const scanEvent = {
		title: "E2E live scan event",
		type: seedEventTypes[0],
		status: "approved" as const,
		points: 5,
		place: "SOM 111",
		capacity: null,
		graceMinutes: null,
		startsAt: eventStartsAt,
		endsAt: eventEndsAt,
		allDay: false,
		readOnly: false,
		publicCode: null,
		description: "A deterministic local scanner fixture.",
		rsvpFormJson: [],
		rsvpResponsesPublic: false,
		createdBy: "mem_demo_member",
		approvedBy: "mem_demo_admin",
		approvedAt: now,
		checkinSecret: "e2e-checkin-secret",
		deletedAt: null,
	};
	await db
		.insert(roles)
		.values({ id: "role_super", key: "super", label: "Super admin", description: "Full portal access.", kind: "admin" })
		.onConflictDoNothing();
	await db
		.insert(members)
		.values([
			{ id: "mem_demo_admin", email: "admin@example.com", name: "Demo Admin", fullName: "Demo Admin", status: "active" },
			{ id: "mem_demo_member", email: "member@example.com", name: "Demo Member", fullName: "Demo Member", status: "active" },
		])
		.onConflictDoNothing();
	await db
		.insert(memberRoles)
		.values({ memberId: "mem_demo_admin", roleId: "role_super", assignedBy: "mem_demo_admin" })
		.onConflictDoNothing();
	await db
		.insert(terms)
		.values({
			id: "term_2026_1",
			name: "Term 1 2026",
			retainedAt: 20,
			probationBelow: 10,
			startsAt: termStartsAt,
			endsAt: termEndsAt,
		})
		.onConflictDoUpdate({ target: terms.id, set: { startsAt: termStartsAt, endsAt: termEndsAt } });
	await db
		.delete(retentionRecords)
		.where(
			and(
				eq(retentionRecords.eventId, "evt_e2e_scan"),
				eq(retentionRecords.memberId, "mem_demo_member"),
				eq(retentionRecords.source, "event_attendance"),
			),
		);
	await db
		.delete(crsAttendance)
		.where(and(eq(crsAttendance.eventId, "evt_e2e_scan"), eq(crsAttendance.memberId, "mem_demo_member")));
	await db
		.insert(crsEvents)
		.values({ id: "evt_e2e_scan", ...scanEvent })
		.onConflictDoUpdate({ target: crsEvents.id, set: scanEvent });
	await db
		.insert(eventStaff)
		.values({ eventId: "evt_e2e_scan", memberId: "mem_demo_admin", role: "scanner", addedBy: "mem_demo_admin" })
		.onConflictDoUpdate({
			target: [eventStaff.eventId, eventStaff.memberId],
			set: { role: "scanner", addedBy: "mem_demo_admin", addedAt: now },
		});
}
