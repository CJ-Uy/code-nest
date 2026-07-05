import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "@/lib/calendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Source colour keyed to the theme; a left dot + tint keeps the grid legible in light/dark.
const SOURCE_CHIP: Record<CalendarItem["source"], string> = {
	event: "bg-primary/10 text-foreground",
	birthday: "bg-accent/15 text-foreground",
	term_deadline: "bg-destructive/10 text-foreground",
};
const SOURCE_DOT: Record<CalendarItem["source"], string> = {
	event: "bg-primary",
	birthday: "bg-accent",
	term_deadline: "bg-destructive",
};

function isoFor(year: number, month: number, day: number): string {
	return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function CalendarMonth({ items, year, month }: { items: CalendarItem[]; year: number; month: number }) {
	const todayIso = new Date().toISOString().slice(0, 10);

	// Bucket items by their ISO day.
	const byDay = new Map<string, CalendarItem[]>();
	for (const item of items) {
		const list = byDay.get(item.date);
		if (list) list.push(item);
		else byDay.set(item.date, [item]);
	}

	// UTC to match the ISO date strings the repository emits.
	const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	const cells: (number | null)[] = [
		...Array.from({ length: firstWeekday }, () => null),
		...Array.from({ length: daysInMonth }, (_, i) => i + 1),
	];
	while (cells.length % 7 !== 0) cells.push(null);

	return (
		<div className="overflow-hidden rounded-xl border border-border bg-card">
			<div className="grid grid-cols-7 border-b border-border bg-secondary/30">
				{WEEKDAYS.map((day) => (
					<div key={day} className="px-2 py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
						<span className="hidden sm:inline">{day}</span>
						<span className="sm:hidden">{day[0]}</span>
					</div>
				))}
			</div>
			<div className="grid grid-cols-7">
				{cells.map((day, idx) => {
					if (day === null) return <div key={`blank-${idx}`} className="min-h-20 border-b border-r border-border bg-secondary/10 last:border-r-0" />;
					const iso = isoFor(year, month, day);
					const dayItems = byDay.get(iso) ?? [];
					const isToday = iso === todayIso;
					return (
						<div
							key={iso}
							className={cn(
								"min-h-20 border-b border-r border-border p-1 sm:min-h-28 sm:p-1.5",
								(idx + 1) % 7 === 0 && "border-r-0",
								isToday && "bg-accent/5",
							)}
						>
							<div className="flex justify-end">
								<span
									className={cn(
										"grid size-6 place-items-center rounded-full text-xs tabular-nums",
										isToday ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground",
									)}
								>
									{day}
								</span>
							</div>
							<div className="mt-0.5 flex flex-col gap-0.5">
								{dayItems.slice(0, 3).map((item) => {
									const chip = (
										<div
											className={cn(
												"flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight sm:text-xs",
												SOURCE_CHIP[item.source],
											)}
										>
											<span className={cn("size-1.5 shrink-0 rounded-full", SOURCE_DOT[item.source])} aria-hidden />
											<span className="truncate">{item.title}</span>
										</div>
									);
									return item.href ? (
										<Link key={item.id} href={item.href} className="block hover:opacity-80">
											{chip}
										</Link>
									) : (
										<div key={item.id}>{chip}</div>
									);
								})}
								{dayItems.length > 3 ? (
									<span className="px-1 text-[10px] text-muted-foreground">+{dayItems.length - 3} more</span>
								) : null}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
