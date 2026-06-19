import { describe, expect, it } from "vitest";
import { monthRange, toIsoDate } from "./calendar";

describe("monthRange", () => {
	it("returns a half-open UTC month window", () => {
		const { start, end } = monthRange(2026, 6);
		expect(start.toISOString()).toBe("2026-06-01T00:00:00.000Z");
		expect(end.toISOString()).toBe("2026-07-01T00:00:00.000Z");
	});

	it("rolls over the year at December", () => {
		const { start, end } = monthRange(2026, 12);
		expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
		expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
	});
});

describe("toIsoDate", () => {
	it("formats a date as a UTC calendar day", () => {
		expect(toIsoDate(new Date("2026-06-19T23:59:00.000Z"))).toBe("2026-06-19");
	});
});
