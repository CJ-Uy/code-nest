export const RESERVED_SLUG_DEFAULTS = [
	"admin",
	"api",
	"favicon.ico",
	"internal",
	"portal",
	"signin",
	"_next",
] as const;

export function normalizeSlug(value: string): string {
	return value.trim().replace(/^\/+/, "").toLowerCase();
}

export function isValidSlugFormat(value: string): boolean {
	return /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(value);
}

export function isValidDestinationUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}
