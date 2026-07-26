import { describe, expect, it } from "vitest";
import { parseEventTypeRuleInput } from "./input";

function formDataFor(fields: Record<string, string>): FormData {
	const formData = new FormData();
	for (const [key, value] of Object.entries(fields)) {
		formData.set(key, value);
	}
	return formData;
}

describe("parseEventTypeRuleInput", () => {
	it("throws when requiredPermission is absent from the FormData, rather than defaulting to open", () => {
		const formData = new FormData();
		formData.set("type", "casual");
		// requiredPermission intentionally not set — this is the shape a browser submits when a
		// selected-but-disabled <option> is dropped from the form-data-set entirely.
		expect(() => parseEventTypeRuleInput(formData)).toThrow();
	});

	it('maps "" to { requiredPermission: null } — the only way to open a type to any member', () => {
		const formData = formDataFor({ type: "casual", requiredPermission: "" });
		expect(parseEventTypeRuleInput(formData)).toEqual({ type: "casual", requiredPermission: null });
	});

	it("passes a recognized permission through unchanged", () => {
		const formData = formDataFor({ type: "official", requiredPermission: "event:create_restricted" });
		expect(parseEventTypeRuleInput(formData)).toEqual({
			type: "official",
			requiredPermission: "event:create_restricted",
		});
	});

	it("passes an unrecognized permission through unchanged instead of mapping it to null", () => {
		const formData = formDataFor({ type: "birthday", requiredPermission: "weird:unknown" });
		expect(parseEventTypeRuleInput(formData)).toEqual({ type: "birthday", requiredPermission: "weird:unknown" });
	});

	it("throws for an invalid event type", () => {
		const formData = formDataFor({ type: "not-a-real-type", requiredPermission: "" });
		expect(() => parseEventTypeRuleInput(formData)).toThrow();
	});
});
