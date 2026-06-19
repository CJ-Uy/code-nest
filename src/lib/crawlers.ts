const CRAWLER_PATTERN =
	/facebookexternalhit|Twitterbot|Slackbot|Discordbot|WhatsApp|TelegramBot|LinkedInBot|Pinterest|redditbot|Googlebot|bingbot|Embedly|SkypeUriPreview/i;

export function isCrawlerUserAgent(userAgent: string | null): boolean {
	if (!userAgent) return false;
	return CRAWLER_PATTERN.test(userAgent);
}

function escapeHtml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

export function renderPreviewHtml(input: {
	title: string;
	description: string | null;
	imageUrl: string | null;
	destinationUrl: string;
}): string {
	const title = escapeHtml(input.title);
	const url = escapeHtml(input.destinationUrl);
	const tags = [
		`<meta charset="utf-8">`,
		`<title>${title}</title>`,
		`<meta property="og:title" content="${title}">`,
		`<meta property="og:url" content="${url}">`,
		`<meta property="og:type" content="website">`,
		`<meta name="twitter:card" content="summary_large_image">`,
		`<meta http-equiv="refresh" content="0;url=${url}">`,
	];
	if (input.description) {
		const description = escapeHtml(input.description);
		tags.push(`<meta property="og:description" content="${description}">`);
		tags.push(`<meta name="twitter:description" content="${description}">`);
	}
	if (input.imageUrl) {
		const imageUrl = escapeHtml(input.imageUrl);
		tags.push(`<meta property="og:image" content="${imageUrl}">`);
		tags.push(`<meta name="twitter:image" content="${imageUrl}">`);
	}
	return `<!doctype html><html><head>${tags.join("")}</head><body><a href="${url}">Continue</a></body></html>`;
}
