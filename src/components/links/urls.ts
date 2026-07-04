export function shortLinkUrl(origin: string, slug: string): string {
	return new URL(`/${slug}`, origin).toString();
}
