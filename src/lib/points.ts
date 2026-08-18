/**
 * Points are stored as SQLite REAL so an award can be worth 0.75. Two decimals is the
 * whole range anyone has asked for, and quantizing at every write boundary keeps the
 * stored value clean, so sums and exports never surface 0.30000000000000004.
 */
export const POINTS_MAX_DECIMALS = 2;

const SCALE = 10 ** POINTS_MAX_DECIMALS;

/** Round to 2 decimals. Input already at or below that precision is unchanged. */
export function quantizePoints(value: number): number {
	return Math.round(value * SCALE) / SCALE;
}

/**
 * Display form: trailing zeros dropped, so 1 renders "1" and 0.75 renders "0.75".
 * ponytail: String() after quantizing is enough - no Intl, no padding. Swap in
 * toLocaleString if points ever need grouping separators.
 */
export function formatPoints(value: number): string {
	return String(quantizePoints(value));
}

/** True when a parsed number is usable as a point value at all. */
export function isValidPoints(value: number): boolean {
	return Number.isFinite(value);
}
