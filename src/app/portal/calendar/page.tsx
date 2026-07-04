import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getRepositories } from "@/db";
import { Button } from "@/components/ui/button";
import { CalendarMonth } from "@/components/calendar-month";
import { requireActor } from "@/server/auth/actor";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage({
	searchParams,
}: {
	searchParams: Promise<{ year?: string; month?: string }>;
}) {
	const actor = await requireActor();
	const params = await searchParams;
	const now = new Date();
	const year = Number(params.year) || now.getUTCFullYear();
	const month = Number(params.month) || now.getUTCMonth() + 1;

	const repositories = await getRepositories();
	const items = await repositories.calendar.getMonth(actor, { year, month }).catch(() => []);

	const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
	const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

	return (
		<div className="grid gap-5">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase text-primary">Member workspace</p>
					<h1 className="font-heading text-3xl">Calendar</h1>
				</div>
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
			</div>
			<CalendarMonth items={items} monthLabel={`${MONTH_NAMES[month - 1]} ${year}`} />
		</div>
	);
}
