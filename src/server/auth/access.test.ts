import { describe, expect, it } from "vitest";
import { isGoogleSignInAllowed } from "./access";

const policy = {
	allowedDomains: ["ateneo.edu"],
	allowlistEmails: ["officer@gmail.com"],
};

describe("Google sign-in policy", () => {
	it("allows a verified email from an allowed domain", () => {
		expect(
			isGoogleSignInAllowed(
				{ provider: "google", email: "member@ateneo.edu", emailVerified: true },
				policy,
			),
		).toBe(true);
	});

	it("allows a verified email on the explicit allowlist", () => {
		expect(
			isGoogleSignInAllowed(
				{ provider: "google", email: "OFFICER@gmail.com", emailVerified: true },
				policy,
			),
		).toBe(true);
	});

	it.each([
		{ provider: "github", email: "member@ateneo.edu", emailVerified: true },
		{ provider: "google", email: "member@ateneo.edu", emailVerified: false },
		{ provider: "google", email: "outsider@example.com", emailVerified: true },
		{ provider: "google", email: null, emailVerified: true },
	])("rejects an ineligible profile", (profile) => {
		expect(isGoogleSignInAllowed(profile, policy)).toBe(false);
	});
});
