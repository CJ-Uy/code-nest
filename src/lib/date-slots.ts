export type DaySlot = { date: string; day: number; inMonth: boolean };

const pad = (value: number) => String(value).padStart(2, "0");

/** "YYYY-MM-DDTHH:mm" in local wall-clock time — the format <input type="datetime-local"> uses. */
export function toLocalInput(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toLocalDate(date: Date): string {
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Six weeks starting on the Monday on or before the 1st. Fixed 42 cells so the
 * calendar does not change height between months.
 */
export function buildMonthGrid(year: number, month: number): DaySlot[] {
	const first = new Date(year, month, 1);
	// getDay() is 0=Sunday; shift so Monday is 0.
	const offset = (first.getDay() + 6) % 7;
	const start = new Date(year, month, 1 - offset);
	return Array.from({ length: 42 }, (_, index) => {
		const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
		return { date: toLocalDate(date), day: date.getDate(), inMonth: date.getMonth() === month };
	});
}

export function timeSlots(stepMinutes: number): string[] {
	const slots: string[] = [];
	for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
		slots.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
	}
	return slots;
}

/**
 * Adds a duration to a local datetime string. Uses the Date constructor's local
 * component arithmetic, so it rolls over days, months, and DST correctly.
 */
export function deriveEnd(startLocal: string, durationMinutes: number): string {
	if (!startLocal) return "";
	const [datePart, timePart] = startLocal.split("T");
	const [year, month, day] = datePart.split("-").map(Number);
	const [hour, minute] = (timePart ?? "00:00").split(":").map(Number);
	return toLocalInput(new Date(year, month - 1, day, hour, minute + durationMinutes));
}
