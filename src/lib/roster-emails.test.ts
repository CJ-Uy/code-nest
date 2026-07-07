import { describe, expect, it } from "vitest";
import { parseEmailColumn } from "./roster-emails";

describe("parseEmailColumn", () => {
	it("splits, lowercases, dedupes, and keeps invalid tokens", () => {
		const result = parseEmailColumn('A@x.com\nA@X.com, b@y.com; nope\n"Jane" <j@z.com>');
		expect(result.valid.sort()).toEqual(["a@x.com", "b@y.com"]);
		expect(result.invalid).toEqual(["nope", '"jane" <j@z.com>']);
		expect(result.dedupedInput).toBe(1);
	});
});
