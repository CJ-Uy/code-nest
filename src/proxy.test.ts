import { describe, expect, it } from "vitest";
import { featureForPath } from "./proxy";

describe("featureForPath", () => {
	it("maps only disabled page routes to their feature", () => {
		expect(featureForPath("/portal/events")).toBe("retention");
		expect(featureForPath("/portal/library/lists")).toBe("library");
		expect(featureForPath("/portal/admin/content/surveys")).toBe("surveys");
		expect(featureForPath("/product/article")).toBe("publicSite");
		for (const path of ["/", "/portal/calendar", "/portal/links", "/events/event-1", "/welcome", "/api/contact"])
			expect(featureForPath(path)).toBeNull();
	});
});
