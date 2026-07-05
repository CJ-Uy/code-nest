import Link from "next/link";
import { ArrowRight, CalendarX2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/portal/empty-state";

export type EventListItem = {
	id: string;
	title: string;
	type: "official" | "casual" | "birthday";
	place: string;
	startsAt: Date;
	endsAt: Date | null;
	myRole: "owner" | "admin" | "scanner" | null;
	canModerate: boolean;
};

const ROLE_LABEL: Record<NonNullable<EventListItem["myRole"]>, string> = {
	owner: "Hosting",
	admin: "Managing",
	scanner: "Scanning",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function timeRange(start: Date, end: Date | null): string {
	const t = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
	return end ? `${t(start)} – ${t(end)}` : t(start);
}

function Row({ event }: { event: EventListItem }) {
	const manage = event.myRole === "owner" || event.myRole === "admin" || event.canModerate;
	return (
		<Link
			href={`/portal/calendar/${event.id}`}
			className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/40"
		>
			<div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-border py-1.5 leading-none">
				<span className="text-[10px] font-semibold uppercase text-primary">{MONTHS[event.startsAt.getMonth()]}</span>
				<span className="font-heading text-lg tabular-nums">{event.startsAt.getDate()}</span>
			</div>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span className="truncate font-medium">{event.title}</span>
					{event.myRole ? (
						<Badge variant="secondary" className="shrink-0 text-[10px]">
							{ROLE_LABEL[event.myRole]}
						</Badge>
					) : null}
				</div>
				<p className="truncate text-sm text-muted-foreground">
					{event.place} · {timeRange(event.startsAt, event.endsAt)}
				</p>
			</div>
			<span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground sm:flex">
				{manage ? "Manage" : "View"}
				<ArrowRight className="size-3.5" />
			</span>
		</Link>
	);
}

function Section({ title, events }: { title: string; events: EventListItem[] }) {
	if (events.length === 0) return null;
	return (
		<div className="grid gap-2">
			<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
			<Card>
				<CardContent className="divide-y divide-border p-0">
					{events.map((event) => (
						<Row key={event.id} event={event} />
					))}
				</CardContent>
			</Card>
		</div>
	);
}

export function EventsList({ events }: { events: EventListItem[] }) {
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
			<Section title="Your events" events={yours} />
			<Section title={yours.length ? "Everything else" : "Upcoming"} events={rest} />
		</div>
	);
}
