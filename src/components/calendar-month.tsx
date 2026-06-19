import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CalendarItem } from "@/lib/calendar";

const SOURCE_LABEL: Record<CalendarItem["source"], string> = {
	event: "Event",
	birthday: "Birthday",
	term_deadline: "Deadline",
};

export function CalendarMonth({ items, monthLabel }: { items: CalendarItem[]; monthLabel: string }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{monthLabel}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-2">
				{items.length === 0 ? (
					<p className="text-sm text-muted-foreground">Nothing scheduled this month.</p>
				) : (
					items.map((item) => {
						const row = (
							<div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
								<div className="flex flex-col">
									<span className="text-sm font-medium">{item.title}</span>
									<span className="text-xs text-muted-foreground">{item.date}</span>
								</div>
								<Badge variant="secondary">{SOURCE_LABEL[item.source]}</Badge>
							</div>
						);
						return item.href ? (
							<Link key={item.id} href={item.href} className="block transition hover:opacity-80">
								{row}
							</Link>
						) : (
							<div key={item.id}>{row}</div>
						);
					})
				)}
			</CardContent>
		</Card>
	);
}
