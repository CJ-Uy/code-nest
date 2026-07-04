import type { ResolvedLink } from "@/db/repositories/links";
import { isCrawlerUserAgent, renderPreviewHtml } from "@/lib/crawlers";
import { deviceBucket } from "@/lib/links";

export type RedirectDependencies = {
	resolveForRedirect(slug: string): Promise<ResolvedLink | null>;
	recordClick(linkId: string, input: { date: string; referrerBucket: string; deviceBucket: string }): Promise<void>;
	scheduleBackground(task: Promise<unknown>): void;
	previewImageBaseUrl: string;
};

export async function buildRedirectResponse(deps: RedirectDependencies, request: Request, routeSlug?: string): Promise<Response> {
	const requestUrl = new URL(request.url);
	const slug = routeSlug ?? requestUrl.pathname.replace(/^\//, "");
	const link = await deps.resolveForRedirect(slug);
	if (!link) return new Response("Not found", { status: 404 });

	const userAgent = request.headers.get("user-agent");
	// Two sources only: a QR scan (its URL carries ?s=qr) or a placed/pasted link.
	// Referrer headers are unreliable — messaging/native apps strip them — so everything
	// that isn't a scan is just "direct".
	const scanned = requestUrl.searchParams.get("s") === "qr";
	deps.scheduleBackground(
		deps
			.recordClick(link.id, {
				date: new Date().toISOString().slice(0, 10),
				referrerBucket: scanned ? "qr scan" : "direct",
				deviceBucket: deviceBucket(userAgent),
			})
			.catch(() => {}),
	);

	if (isCrawlerUserAgent(userAgent)) {
		const imageUrl = link.previewImageKey
			? new URL(`/api/uploads/${encodeURIComponent(link.previewImageKey)}`, deps.previewImageBaseUrl).toString()
			: null;
		const html = renderPreviewHtml({
			title: link.previewTitle ?? link.title,
			description: link.previewDescription,
			imageUrl,
			destinationUrl: link.destinationUrl,
		});
		return new Response(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8" } });
	}

	return new Response(null, { status: 302, headers: { location: link.destinationUrl } });
}
