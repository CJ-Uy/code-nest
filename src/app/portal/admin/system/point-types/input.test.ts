import { describe, expect, it } from "vitest";
import { parsePointTypeUpsertInput } from "./input";

function formDataFor(fields: Record<string, string | undefined>): FormData {
	const data = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		if (value !== undefined) data.set(key, value);
	}
	return data;
}

describe("parsePointTypeUpsertInput", () => {
	const base = {
		id: "pt_frontliner",
		key: "frontliner",
		label: "Frontliner",
		position: "2",
		active: "on",
		countsTowardRetention: "on",
	};

	it("parses an existing point type", () => {
		expect(parsePointTypeUpsertInput(formDataFor(base))).toEqual({
			id: "pt_frontliner",
			key: "frontliner",
			label: "Frontliner",
			position: 2,
			active: true,
			countsTowardRetention: true,
		});
	});

	it("treats absent checkboxes as false", () => {
		expect(
			parsePointTypeUpsertInput(
				formDataFor({ ...base, active: undefined, countsTowardRetention: undefined }),
			),
		).toMatchObject({ active: false, countsTowardRetention: false });
	});

	it("accepts a new immutable key and rejects malformed keys", () => {
		expect(parsePointTypeUpsertInput(formDataFor({ ...base, id: "", key: "project_lead" })).id).toBeNull();
		expect(() => parsePointTypeUpsertInput(formDataFor({ ...base, id: "", key: "Project Lead" }))).toThrow();
	});

	it("rejects blank labels and non-integer positions", () => {
		expect(() => parsePointTypeUpsertInput(formDataFor({ ...base, label: " " }))).toThrow();
		expect(() => parsePointTypeUpsertInput(formDataFor({ ...base, position: "1.5" }))).toThrow();
	});
});
