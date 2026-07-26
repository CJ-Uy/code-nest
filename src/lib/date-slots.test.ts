import { describe, expect, it } from "vitest";
import { buildMonthGrid, deriveEnd, timeSlots, toLocalInput } from "./date-slots";

describe("buildMonthGrid", () => {
	it("always returns six full weeks so the grid never jumps height", () => {
		expect(buildMonthGrid(2026, 6)).toHaveLength(42);
	});

	it("pads leading and trailing days from the neighbouring months", () => {
		// July 2026 starts on a Wednesday.
		const grid = buildMonthGrid(2026, 6);
		expect(grid[0]).toEqual({ date: "2026-06-29", day: 29, inMonth: false });
		expect(grid[2]).toEqual({ date: "2026-07-01", day: 1, inMonth: true });
		expect(grid.filter((slot) => slot.inMonth)).toHaveLength(31);
	});

	it("handles a leap February", () => {
		const grid = buildMonthGrid(2028, 1);
		expect(grid.filter((slot) => slot.inMonth)).toHaveLength(29);
	});
});

describe("timeSlots", () => {
	it("covers the whole day at the requested step", () => {
		const slots = timeSlots(30);
		expect(slots).toHaveLength(48);
		expect(slots[0]).toBe("00:00");
		expect(slots[26]).toBe("13:00");
		expect(slots[47]).toBe("23:30");
	});
});

describe("deriveEnd", () => {
	it("adds the duration", () => {
		expect(deriveEnd("2026-07-25T13:00", 60)).toBe("2026-07-25T14:00");
	});

	it("rolls over midnight into the next day", () => {
		expect(deriveEnd("2026-07-25T23:30", 60)).toBe("2026-07-26T00:30");
	});

	it("rolls over a month boundary", () => {
		expect(deriveEnd("2026-07-31T23:00", 120)).toBe("2026-08-01T01:00");
	});

	it("returns an empty string for an empty start", () => {
		expect(deriveEnd("", 60)).toBe("");
	});
});

describe("toLocalInput", () => {
	it("formats local wall-clock time, not UTC", () => {
		const date = new Date(2026, 6, 25, 13, 5);
		expect(toLocalInput(date)).toBe("2026-07-25T13:05");
	});
});
