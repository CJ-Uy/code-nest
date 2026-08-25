import { describe, expect, it } from "vitest";
import { formatPoints, heatStep, quantizePoints } from "./points";

describe("quantizePoints", () => {
	it("leaves a whole number alone", () => {
		expect(quantizePoints(5)).toBe(5);
	});

	it("leaves two decimals alone", () => {
		expect(quantizePoints(0.75)).toBe(0.75);
	});

	it("rounds a third decimal away", () => {
		expect(quantizePoints(0.756)).toBe(0.76);
	});

	it("keeps negative deductions symmetric", () => {
		expect(quantizePoints(-0.755)).toBe(-0.76);
		expect(quantizePoints(10.075)).toBe(10.08);
		expect(quantizePoints(-10.075)).toBe(-10.08);
	});

	it("clears binary float dust from a sum", () => {
		expect(quantizePoints(0.1 + 0.2)).toBe(0.3);
	});
});

describe("formatPoints", () => {
	it("drops trailing zeros", () => {
		expect(formatPoints(1.5)).toBe("1.5");
		expect(formatPoints(2)).toBe("2");
	});

	it("never renders float dust", () => {
		expect(formatPoints(0.1 + 0.2)).toBe("0.3");
	});
});

describe("heatStep", () => {
	it("gives an empty day no shade", () => {
		expect(heatStep(0, 10)).toBe(0);
	});

	it("shades a negative day as empty rather than inverting", () => {
		expect(heatStep(-5, 10)).toBe(0);
	});

	it("puts the busiest day in the top bucket", () => {
		expect(heatStep(10, 10)).toBe(4);
	});

	it("spreads the range across four buckets", () => {
		expect(heatStep(2.5, 10)).toBe(1);
		expect(heatStep(5, 10)).toBe(2);
		expect(heatStep(7.5, 10)).toBe(3);
	});

	it("gives the smallest fraction a visible bucket", () => {
		expect(heatStep(0.25, 100)).toBe(1);
	});

	it("never divides by a zero maximum", () => {
		expect(heatStep(5, 0)).toBe(0);
	});
});
