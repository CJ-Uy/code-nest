import { describe, expect, it } from "vitest";
import { dailyTrendSeries, normalizeDateRange, presetDateRange, summarizeTrend, trendSeries } from "./stats-utils";

const series = [
	{ date: "2026-06-17", count: 3 },
	{ date: "2026-06-19", count: 7 },
	{ date: "2026-06-24", count: 4 },
];

describe("link stats utilities", () => {
	it("builds quick ranges and fills quiet days", () => {
		const range = presetDateRange("7d", "2026-06-24", series);
		expect(range).toEqual({ start: "2026-06-18", end: "2026-06-24" });
		expect(dailyTrendSeries(series, range)).toEqual([
			{ date: "2026-06-18", count: 0 },
			{ date: "2026-06-19", count: 7 },
			{ date: "2026-06-20", count: 0 },
			{ date: "2026-06-21", count: 0 },
			{ date: "2026-06-22", count: 0 },
			{ date: "2026-06-23", count: 0 },
			{ date: "2026-06-24", count: 4 },
		]);
	});

	it("normalizes custom ranges and summarizes against the previous period", () => {
		const range = normalizeDateRange("2026-06-24", "2026-06-18");
		expect(range).toEqual({ start: "2026-06-18", end: "2026-06-24" });
		expect(summarizeTrend(series, range)).toMatchObject({
			total: 11,
			activeDays: 2,
			peak: { date: "2026-06-19", count: 7 },
			previousTotal: 3,
			change: 8,
		});
	});

	it("groups longer views by week or month", () => {
		expect(trendSeries(series, { start: "2026-06-01", end: "2026-06-30" }, "week")).toEqual([
			{ date: "2026-06-15", count: 10 },
			{ date: "2026-06-22", count: 4 },
		]);
		expect(trendSeries(series, { start: "2026-06-01", end: "2026-06-30" }, "month")).toEqual([{ date: "2026-06", count: 14 }]);
	});
});
