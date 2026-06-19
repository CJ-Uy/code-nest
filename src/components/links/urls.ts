export function shortLinkUrl(origin: string, slug: string): string {
	return new URL(`/l/${slug}`, origin).toString();
}
