import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { getRepositories } from "@/db";
import { Button } from "@/components/ui/button";
import { CalendarMonth } from "@/components/calendar-month";
import { requireActor } from "@/server/auth/actor";
import { CreateEventSheet } from "./create-event-sheet";
import { EventsList, type EventListItem } from "./events-list";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage({
	searchParams,
}: {
	searchParams: Promise<{ year?: string; month?: string; view?: string }>;
}) {
	const actor = await requireActor();
	const params = await searchParams;
	const view = params.view === "list" ? "list" : "calendar";
	const now = new Date();
	const year = Number(params.year) || now.getUTCFullYear();
	const month = Number(params.month) || now.getUTCMonth() + 1;

	const repositories = await getRepositories();

	const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
	const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

	const viewTabs = [
		{ id: "calendar", label: "Calendar", icon: CalendarDays, href: "/portal/calendar" },
		{ id: "list", label: "List", icon: List, href: "/portal/calendar?view=list" },
	];

	return (
		<div className="grid gap-5">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase text-primary">Member workspace</p>
					<h1 className="font-heading text-3xl">Calendar</h1>
				</div>
				<CreateEventSheet />
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="inline-flex rounded-lg border border-border p-0.5">
					{viewTabs.map((tab) => {
						const Icon = tab.icon;
						const active = view === tab.id;
						return (
							<Link
								key={tab.id}
								href={tab.href}
								className={
									active
										? "inline-flex items-center gap-1.5 rounded-md bg-secondary px-3 py-1.5 text-sm font-semibold text-foreground"
										: "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
								}
							>
								<Icon className="size-4" />
								{tab.label}
							</Link>
						);
					})}
				</div>

				{view === "calendar" ? (
					<div className="flex items-center gap-2">
						<Button asChild variant="outline" size="sm">
							<Link href={`/portal/calendar?year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}`}>Today</Link>
						</Button>
						<Button asChild variant="outline" size="icon" aria-label="Previous month">
							<Link href={`/portal/calendar?year=${prev.year}&month=${prev.month}`}>
								<ChevronLeft />
							</Link>
						</Button>
						<span className="min-w-36 text-center text-sm font-semibold">
							{MONTH_NAMES[month - 1]} {year}
						</span>
						<Button asChild variant="outline" size="icon" aria-label="Next month">
							<Link href={`/portal/calendar?year=${next.year}&month=${next.month}`}>
								<ChevronRight />
							</Link>
						</Button>
					</div>
				) : null}
			</div>

			{view === "calendar" ? (
				<CalendarMonth
					items={await repositories.calendar.getMonth(actor, { year, month }).catch(() => [])}
					year={year}
					month={month}
				/>
			) : (
				<EventsList events={await loadEventList(repositories, actor)} />
			)}
		</div>
	);
}

// List view keys off the viewer-scoped `myRole` field from listPublished (plan Shared Seam).
// Falls back to empty until the member-owned backend (Codex phase B3) lands listPublished.
async function loadEventList(
	repositories: Awaited<ReturnType<typeof getRepositories>>,
	actor: Awaited<ReturnType<typeof requireActor>>,
): Promise<EventListItem[]> {
	const events = await repositories.events.listPublished(actor).catch(() => []);
	return events.map((e) => ({
		id: e.id,
		title: e.title,
		type: e.type,
		place: e.place,
		startsAt: e.startsAt,
		endsAt: e.endsAt,
		myRole: e.myRole,
		canModerate: e.canModerate,
	}));
}
