import { describe, expect, it } from "vitest";
import { buildPointBreakdown } from "./point-breakdown";

const types = [
	{ id: "pt_retention", key: "retention", label: "Retention", countsTowardRetention: true, active: true, position: 1 },
	{ id: "pt_frontliner", key: "frontliner", label: "Frontliner", countsTowardRetention: false, active: true, position: 2 },
	{ id: "pt_project_lead", key: "project_lead", label: "Project Lead", countsTowardRetention: false, active: true, position: 3 },
	{ id: "pt_retired", key: "retired", label: "Retired", countsTowardRetention: false, active: false, position: 4 },
];

const records = [
	{ pointTypeId: "pt_retention", points: 8 },
	{ pointTypeId: "pt_retention", points: 2 },
	{ pointTypeId: "pt_frontliner", points: 3 },
	{ pointTypeId: "pt_retired", points: 50 },
];

describe("buildPointBreakdown", () => {
	it("returns one ordered row per active type including zero totals", () => {
		expect(buildPointBreakdown(types, records)).toEqual([
			{ pointTypeId: "pt_retention", label: "Retention", totalPoints: 10, retention: true },
			{ pointTypeId: "pt_frontliner", label: "Frontliner", totalPoints: 3, retention: false },
			{ pointTypeId: "pt_project_lead", label: "Project Lead", totalPoints: 0, retention: false },
		]);
	});

	it("ignores null points", () => {
		expect(buildPointBreakdown(types, [{ pointTypeId: "pt_retention", points: null }])[0]?.totalPoints).toBe(0);
	});
});

describe("buildPointBreakdown with two counting-toward-retention types", () => {
	// The seed ships exactly one countsTowardRetention type today, so this case only becomes
	// member-visible once an admin ticks a second type. Neither type here uses the "retention"
	// key, proving the row's flag tracks countsTowardRetention and not the magic key.
	const multiCountingTypes = [
		{ id: "pt_dues", key: "dues", label: "Dues", countsTowardRetention: true, active: true, position: 1 },
		{ id: "pt_service", key: "service", label: "Service", countsTowardRetention: true, active: true, position: 2 },
		{ id: "pt_social", key: "social", label: "Social", countsTowardRetention: false, active: true, position: 3 },
	];
	const multiCountingRecords = [
		{ pointTypeId: "pt_dues", points: 6 },
		{ pointTypeId: "pt_service", points: 8 },
		{ pointTypeId: "pt_social", points: 4 },
	];

	it("marks every countsTowardRetention type as retention-bearing, each keeping its own total", () => {
		expect(buildPointBreakdown(multiCountingTypes, multiCountingRecords)).toEqual([
			{ pointTypeId: "pt_dues", label: "Dues", totalPoints: 6, retention: true },
			{ pointTypeId: "pt_service", label: "Service", totalPoints: 8, retention: true },
			{ pointTypeId: "pt_social", label: "Social", totalPoints: 4, retention: false },
		]);
	});

	it("does not use the key to decide retention status", () => {
		const relabeled = [
			{ id: "pt_x", key: "not_retention", label: "Anything", countsTowardRetention: true, active: true, position: 1 },
			{ id: "pt_y", key: "retention", label: "Legacy label", countsTowardRetention: false, active: true, position: 2 },
		];
		const rows = buildPointBreakdown(relabeled, []);
		expect(rows.find((row) => row.pointTypeId === "pt_x")?.retention).toBe(true);
		expect(rows.find((row) => row.pointTypeId === "pt_y")?.retention).toBe(false);
	});
});
