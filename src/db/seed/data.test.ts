import { describe, expect, it } from "vitest";
import { RESERVED_SLUG_DEFAULTS } from "@/lib/links";
import { seedLinkDailyStats, seedReservedSlugs, seedShortLinks } from "./data";

describe("link seed data", () => {
	it("seeds all route-shadow reserved slugs from the links helper", () => {
		expect(seedReservedSlugs.map((item) => item.slug)).toEqual(RESERVED_SLUG_DEFAULTS);
	});

	it("seeds a preview-ready link with multi-day analytics", () => {
		expect(seedShortLinks[0]).toMatchObject({
			id: "lnk_demo",
			previewTitle: "Welcome to CODE",
			previewDescription: "Ateneo CODE member resources and sign-in.",
			clickCount: 9,
		});
		expect(seedLinkDailyStats).toHaveLength(3);
		expect(new Set(seedLinkDailyStats.map((row) => row.date))).toEqual(new Set(["2026-06-17", "2026-06-18"]));
	});
});
