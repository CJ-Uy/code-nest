export type StatsPoint = { date: string; count: number };
export type HourlyStatsPoint = { hour: string; count: number };
export type DateRange = { start: string; end: string };
export type DateRangePreset = "today" | "7d" | "month" | "all";
export type TrendGranularity = "hour" | "day" | "week" | "month";

const DAY_MS = 24 * 60 * 60 * 1000;

function parseIsoDay(value: string): Date {
	const [year, month, day] = value.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDay(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function parseIsoHour(value: string): Date {
	return new Date(`${value}:00.000Z`);
}

function formatIsoHour(date: Date): string {
	return date.toISOString().slice(0, 13) + ":00";
}

export function shiftIsoDay(value: string, days: number): string {
	const date = parseIsoDay(value);
	date.setUTCDate(date.getUTCDate() + days);
	return formatIsoDay(date);
}

export function daysInRange(range: DateRange): number {
	return Math.max(1, Math.round((parseIsoDay(range.end).getTime() - parseIsoDay(range.start).getTime()) / DAY_MS) + 1);
}

export function normalizeDateRange(start: string, end: string): DateRange {
	if (!start && !end) return { start, end };
	if (!start) return { start: end, end };
	if (!end) return { start, end: start };
	return start <= end ? { start, end } : { start: end, end: start };
}

export function presetDateRange(preset: DateRangePreset, nowIso: string, series: StatsPoint[]): DateRange {
	const dates = series.map((point) => point.date).sort();
	if (preset === "today") return { start: nowIso, end: nowIso };
	if (preset === "7d") return { start: shiftIsoDay(nowIso, -6), end: nowIso };
	if (preset === "month") return { start: `${nowIso.slice(0, 8)}01`, end: nowIso };
	return { start: dates[0] ?? nowIso, end: dates[dates.length - 1] ?? nowIso };
}

function pointMap(series: StatsPoint[]): Map<string, number> {
	const map = new Map<string, number>();
	for (const point of series) map.set(point.date, (map.get(point.date) ?? 0) + point.count);
	return map;
}

function hourPointMap(series: HourlyStatsPoint[]): Map<string, number> {
	const map = new Map<string, number>();
	for (const point of series) map.set(point.hour, (map.get(point.hour) ?? 0) + point.count);
	return map;
}

export function dailyTrendSeries(series: StatsPoint[], range: DateRange): StatsPoint[] {
	const counts = pointMap(series);
	const days = daysInRange(range);
	return Array.from({ length: days }, (_, index) => {
		const date = shiftIsoDay(range.start, index);
		return { date, count: counts.get(date) ?? 0 };
	});
}

function weekKey(value: string): string {
	const date = parseIsoDay(value);
	const day = date.getUTCDay() || 7;
	date.setUTCDate(date.getUTCDate() - day + 1);
	return formatIsoDay(date);
}

export function trendSeries(series: StatsPoint[], range: DateRange, granularity: TrendGranularity): StatsPoint[] {
	if (granularity === "hour" || granularity === "day") return dailyTrendSeries(series, range);
	const buckets = new Map<string, number>();
	for (const point of series) {
		if (point.date < range.start || point.date > range.end) continue;
		const key = granularity === "month" ? point.date.slice(0, 7) : weekKey(point.date);
		buckets.set(key, (buckets.get(key) ?? 0) + point.count);
	}
	return Array.from(buckets.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

export function hourlyTrendSeries(series: HourlyStatsPoint[], range: DateRange): StatsPoint[] {
	const counts = hourPointMap(series);
	const start = parseIsoHour(`${range.start}T00:00`);
	const end = parseIsoHour(`${range.end}T23:00`);
	const hours = Math.max(1, Math.round((end.getTime() - start.getTime()) / (60 * 60 * 1000)) + 1);
	const fillQuietHours = hours <= 24 * 14;
	if (!fillQuietHours) {
		return Array.from(counts.entries())
			.filter(([hour]) => hour.slice(0, 10) >= range.start && hour.slice(0, 10) <= range.end)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([date, count]) => ({ date, count }));
	}
	return Array.from({ length: hours }, (_, index) => {
		const hourDate = new Date(start);
		hourDate.setUTCHours(hourDate.getUTCHours() + index);
		const date = formatIsoHour(hourDate);
		return { date, count: counts.get(date) ?? 0 };
	});
}

export function previousDateRange(range: DateRange): DateRange {
	const days = daysInRange(range);
	const end = shiftIsoDay(range.start, -1);
	return { start: shiftIsoDay(end, -days + 1), end };
}

export function summarizeTrend(series: StatsPoint[], range: DateRange) {
	const days = dailyTrendSeries(series, range);
	const total = days.reduce((sum, point) => sum + point.count, 0);
	const activeDays = days.filter((point) => point.count > 0).length;
	const peak = days.reduce((best, point) => (point.count > best.count ? point : best), { date: range.start, count: 0 });
	const previous = previousDateRange(range);
	const previousTotal = dailyTrendSeries(series, previous).reduce((sum, point) => sum + point.count, 0);
	return {
		total,
		activeDays,
		averagePerDay: total / days.length,
		peak,
		previousTotal,
		change: total - previousTotal,
		changePct: previousTotal ? ((total - previousTotal) / previousTotal) * 100 : null,
	};
}
