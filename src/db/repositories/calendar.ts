import { and, count, eq, gte, lt } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { crsAttendance, crsEvents, eventMedia, eventRsvps, members, terms } from "@/db/schema";
import type { EventStatus, EventType, RsvpState } from "@/db/schema";
import { can, type Actor } from "@/server/auth/permissions";
import { monthRange, toIsoDate, type CalendarItem } from "@/lib/calendar";

type Db = DrizzleD1Database<typeof schema>;

export type EventDetail = {
	id: string;
	title: string;
	type: EventType;
	status: EventStatus;
	points: number | null;
	place: string;
	capacity: number | null;
	startsAt: Date;
	endsAt: Date | null;
	description: string;
	myRsvp: RsvpState;
	attendingCount: number;
	iAttended: boolean;
	media: Array<{ id: string; r2Key: string; caption: string | null }>;
};

function birthdayInMonth(birthday: string | null, year: number, month: number): string | null {
	if (!birthday) return null;
	const monthPart = birthday.slice(5, 7);
	const dayPart = birthday.slice(8, 10);
	if (Number(monthPart) !== month) return null;
	return `${year}-${monthPart}-${dayPart}`;
}

export type CalendarRepository = {
	getMonth(actor: Actor, input: { year: number; month: number }): Promise<CalendarItem[]>;
	getEvent(actor: Actor, eventId: string): Promise<EventDetail | null>;
};

export function createCalendarRepository(db: Db): CalendarRepository {
	return {
		async getMonth(actor, input) {
			const { start, end } = monthRange(input.year, input.month);
			const items: CalendarItem[] = [];

			const events = await db
				.select({
					id: crsEvents.id,
					title: crsEvents.title,
					startsAt: crsEvents.startsAt,
					endsAt: crsEvents.endsAt,
				})
				.from(crsEvents)
				.where(and(eq(crsEvents.status, "approved"), gte(crsEvents.startsAt, start), lt(crsEvents.startsAt, end)));
			for (const event of events) {
				items.push({
					id: `event:${event.id}`,
					source: "event",
					title: event.title,
					date: toIsoDate(event.startsAt),
					startsAt: event.startsAt.toISOString(),
					endsAt: event.endsAt ? event.endsAt.toISOString() : null,
					eventId: event.id,
					href: `/portal/calendar/${event.id}`,
				});
			}

			const canSeePrivate = can(actor, "member:manage");
			const memberRows = await db
				.select({ id: members.id, name: members.name, birthday: members.birthday, birthdayPrivate: members.birthdayPrivate })
				.from(members);
			for (const member of memberRows) {
				if (member.birthdayPrivate && !canSeePrivate) continue;
				const date = birthdayInMonth(member.birthday, input.year, input.month);
				if (!date) continue;
				items.push({
					id: `birthday:${member.id}`,
					source: "birthday",
					title: `${member.name ?? "Member"} birthday`,
					date,
					startsAt: null,
					endsAt: null,
					eventId: null,
					href: null,
				});
			}

			const termRows = await db
				.select({ id: terms.id, name: terms.name, endsAt: terms.endsAt })
				.from(terms)
				.where(and(gte(terms.endsAt, start), lt(terms.endsAt, end)));
			for (const term of termRows) {
				items.push({
					id: `term_deadline:${term.id}`,
					source: "term_deadline",
					title: `${term.name} ends`,
					date: toIsoDate(term.endsAt),
					startsAt: null,
					endsAt: null,
					eventId: null,
					href: null,
				});
			}

			items.sort((a, b) => a.date.localeCompare(b.date));
			return items;
		},

		async getEvent(actor, eventId) {
			const [event] = await db.select().from(crsEvents).where(eq(crsEvents.id, eventId)).limit(1);
			if (!event || event.status !== "approved") return null;

			const [myRsvp] = await db
				.select({ state: eventRsvps.state })
				.from(eventRsvps)
				.where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.memberId, actor.memberId)))
				.limit(1);

			const [attending] = await db.select({ value: count() }).from(crsAttendance).where(eq(crsAttendance.eventId, eventId));

			const [mine] = await db
				.select({ memberId: crsAttendance.memberId })
				.from(crsAttendance)
				.where(and(eq(crsAttendance.eventId, eventId), eq(crsAttendance.memberId, actor.memberId)))
				.limit(1);

			const media = await db
				.select({ id: eventMedia.id, r2Key: eventMedia.r2Key, caption: eventMedia.caption })
				.from(eventMedia)
				.where(eq(eventMedia.eventId, eventId));

			return {
				id: event.id,
				title: event.title,
				type: event.type,
				status: event.status,
				points: event.points,
				place: event.place,
				capacity: event.capacity,
				startsAt: event.startsAt,
				endsAt: event.endsAt,
				description: event.description,
				myRsvp: myRsvp?.state ?? "none",
				attendingCount: attending?.value ?? 0,
				iAttended: Boolean(mine),
				media,
			};
		},
	};
}
