export type CalendarSource = "event" | "birthday" | "term_deadline";

export type CalendarItem = {
	id: string;
	source: CalendarSource;
	title: string;
	date: string;
	startsAt: string | null;
	endsAt: string | null;
	eventId: string | null;
	href: string | null;
};

export function monthRange(year: number, month: number): { start: Date; end: Date } {
	const start = new Date(Date.UTC(year, month - 1, 1, -8, 0, 0, 0));
	const end = new Date(Date.UTC(year, month, 1, -8, 0, 0, 0));
	return { start, end };
}

export function toIsoDate(date: Date): string {
	return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
