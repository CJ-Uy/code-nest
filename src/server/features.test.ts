import { describe, expect, it } from "vitest";
import { featureFlagSchema } from "./env";
import { featureFlagsFromConfig } from "./features";

describe("release feature flags", () => {
	it("enables only the literal true string", () => {
		expect(featureFlagSchema.parse("true")).toBe(true);
		expect(featureFlagSchema.parse("false")).toBe(false);
		expect(featureFlagSchema.parse("TRUE")).toBe(false);
		expect(featureFlagSchema.parse(undefined)).toBe(false);
	});

	it("maps all six config fields", () => {
		expect(
			featureFlagsFromConfig({
				FEATURE_RETENTION: true,
				FEATURE_LIBRARY: false,
				FEATURE_ANNOUNCEMENTS: true,
				FEATURE_NOTIFICATIONS: false,
				FEATURE_SURVEYS: true,
				FEATURE_PUBLIC_SITE: false,
			}),
		).toEqual({
			retention: true,
			library: false,
			announcements: true,
			notifications: false,
			surveys: true,
			publicSite: false,
		});
	});
});
