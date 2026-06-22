import { describe, expect, it } from "vitest";
import { isGoogleSignInAllowed } from "./access";

const policy = {
	allowedDomains: ["ateneo.edu"],
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

	it("allows any verified Google email when no domains are configured", () => {
		expect(
			isGoogleSignInAllowed(
				{ provider: "google", email: "OFFICER@gmail.com", emailVerified: true },
				{ allowedDomains: [] },
			),
		).toBe(true);
	});

	it("allows the verified bootstrap email outside configured domains", () => {
		expect(
			isGoogleSignInAllowed(
				{ provider: "google", email: " Bootstrap@Example.com ", emailVerified: true },
				{ allowedDomains: ["ateneo.edu"], bootstrapEmail: "bootstrap@example.com" },
			),
		).toBe(true);
	});

	it.each([
		{ provider: "github", email: "member@ateneo.edu", emailVerified: true },
		{ provider: "google", email: "member@ateneo.edu", emailVerified: false },
		{ provider: "google", email: "bootstrap@example.com", emailVerified: false },
		{ provider: "google", email: "outsider@example.com", emailVerified: true },
		{ provider: "google", email: null, emailVerified: true },
	])("rejects an ineligible profile", (profile) => {
		expect(isGoogleSignInAllowed(profile, { ...policy, bootstrapEmail: "bootstrap@example.com" })).toBe(false);
	});
});
