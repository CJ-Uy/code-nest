import { describe, expect, it } from "vitest";
import { createManualRetentionRecordInputSchema } from "./types";

describe("createManualRetentionRecordInputSchema", () => {
	it("accepts a minimal valid manual entry and defaults optional fields", () => {
		const parsed = createManualRetentionRecordInputSchema.parse({
			memberIds: ["mem_a"],
			termId: "term_1",
			reason: "Submitted the required medical waiver",
		});
		expect(parsed).toEqual({
			memberIds: ["mem_a"],
			termId: "term_1",
			eventId: null,
			points: null,
			reason: "Submitted the required medical waiver",
		});
	});

	it("allows a negative point value", () => {
		const parsed = createManualRetentionRecordInputSchema.parse({
			memberIds: ["mem_a"],
			termId: "term_1",
			points: -5,
			reason: "Logged violation",
		});
		expect(parsed.points).toBe(-5);
	});

	it("de-duplicates member ids", () => {
		const parsed = createManualRetentionRecordInputSchema.parse({
			memberIds: ["mem_a", "mem_a", "mem_b"],
			termId: "term_1",
			reason: "Attended makeup session",
		});
		expect(parsed.memberIds).toEqual(["mem_a", "mem_b"]);
	});

	it("rejects an empty member list", () => {
		expect(() =>
			createManualRetentionRecordInputSchema.parse({ memberIds: [], termId: "term_1", reason: "x" }),
		).toThrow();
	});

	it("rejects a blank reason", () => {
		expect(() =>
			createManualRetentionRecordInputSchema.parse({ memberIds: ["mem_a"], termId: "term_1", reason: "   " }),
		).toThrow();
	});

	it("rejects a non-integer point value", () => {
		expect(() =>
			createManualRetentionRecordInputSchema.parse({
				memberIds: ["mem_a"],
				termId: "term_1",
				points: 2.5,
				reason: "x",
			}),
		).toThrow();
	});
});
