import Link from "next/link";
import { ArrowRight, CalendarX2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/portal/empty-state";
import { type EventTypeRow, labelFor } from "@/db/repositories/eventTypeRules";
import { colourClasses } from "@/lib/event-type-colours";
import { formatEventRange, formatUtc8Time, toLocalDate } from "@/lib/date-slots";
import { cn } from "@/lib/utils";

export type EventListItem = {
	id: string;
	title: string;
	type: string;
	place: string;
	startsAt: Date;
	endsAt: Date | null;
	allDay: boolean;
	readOnly: boolean;
	myRole: "owner" | "admin" | "scanner" | null;
	canModerate: boolean;
};

const ROLE_LABEL: Record<NonNullable<EventListItem["myRole"]>, string> = {
	owner: "Hosting",
	admin: "Managing",
	scanner: "Scanning",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function timeRange(start: Date, end: Date | null, allDay: boolean): string {
	// Multi-day and all-day events need the span, not just clock times, or a three-day event reads
	// as if it were over by the afternoon.
	if (allDay || (end && toLocalDate(start) !== toLocalDate(new Date(end.getTime() - 1)))) {
		return formatEventRange(start, end, allDay);
	}
	const t = formatUtc8Time;
	return end ? `${t(start)} - ${t(end)}` : t(start);
}

function Row({ event, types }: { event: EventListItem; types: EventTypeRow[] }) {
	const manage = event.myRole === "owner" || event.myRole === "admin" || event.canModerate;
	const chip = colourClasses(types.find((t) => t.type === event.type)?.colour ?? "slate").chip;
	const [, month, day] = toLocalDate(event.startsAt).split("-").map(Number);
	return (
		<Link
			href={`/portal/calendar/${event.id}`}
			className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-secondary/40 active:bg-secondary/60 sm:gap-4 sm:px-4"
		>
			<div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-border py-1.5 leading-none">
				<span className="text-[10px] font-semibold uppercase text-primary">{MONTHS[(month ?? 1) - 1]}</span>
				<span className="font-heading text-lg tabular-nums">{day}</span>
			</div>
			<div className="min-w-0 flex-1">
				<div className="grid min-w-0 gap-1 sm:flex sm:items-center sm:gap-2">
					<span className="truncate font-medium">{event.title}</span>
					<Badge className={cn("min-w-0 max-w-full truncate sm:max-w-32", chip)}>{labelFor(types, event.type)}</Badge>
					{event.myRole ? (
						<Badge variant="secondary" className="shrink-0 text-[10px]">
							{ROLE_LABEL[event.myRole]}
						</Badge>
					) : null}
					{event.readOnly ? (
						<Badge variant="secondary" className="shrink-0 text-[10px]">
							Info
						</Badge>
					) : null}
				</div>
				<p className="truncate text-sm text-muted-foreground">
					{event.place} · {timeRange(event.startsAt, event.endsAt, event.allDay)}
				</p>
			</div>
			<span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground sm:flex">
				{manage ? "Manage" : "View"}
				<ArrowRight className="size-3.5" />
			</span>
		</Link>
	);
}

function Section({ title, events, types }: { title: string; events: EventListItem[]; types: EventTypeRow[] }) {
	if (events.length === 0) return null;
	return (
		<div className="grid gap-2">
			<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
			<Card>
				<CardContent className="divide-y divide-border p-0">
					{events.map((event) => (
						<Row key={event.id} event={event} types={types} />
					))}
				</CardContent>
			</Card>
		</div>
	);
}

export function EventsList({ events, types }: { events: EventListItem[]; types: EventTypeRow[] }) {
	if (events.length === 0) {
		return (
			<EmptyState
				icon={CalendarX2}
				title="No upcoming events"
				description="Create one and it lands on the calendar right away."
			/>
		);
	}

	const upcoming = [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
	const yours = upcoming.filter((e) => e.myRole !== null);
	const rest = upcoming.filter((e) => e.myRole === null);

	return (
		<div className="grid gap-5">
			<Section title="Your events" events={yours} types={types} />
			<Section title={yours.length ? "Everything else" : "Upcoming"} events={rest} types={types} />
		</div>
	);
}
