export type GoogleSignInProfile = {
	provider: string | null | undefined;
	email: string | null | undefined;
	emailVerified: boolean;
};

export type AuthAccessPolicy = {
	allowedDomains: string[];
	bootstrapEmail?: string;
};

export function isGoogleSignInAllowed(
	profile: GoogleSignInProfile,
	policy: AuthAccessPolicy,
): boolean {
	if (profile.provider !== "google" || !profile.emailVerified || !profile.email) return false;

	const email = profile.email.trim().toLowerCase();
	const domain = email.split("@").at(1);
	const allowedDomains = policy.allowedDomains.map((item) => item.trim().toLowerCase()).filter(Boolean);
	const bootstrapEmail = policy.bootstrapEmail?.trim().toLowerCase();

	return email === bootstrapEmail || allowedDomains.length === 0 || Boolean(domain && allowedDomains.includes(domain));
}

export function splitAuthList(value?: string): string[] {
	return value
		?.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean) ?? [];
}
