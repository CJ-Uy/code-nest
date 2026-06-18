export type ReferrerBucket = "direct" | "internal" | "external";
export type DeviceBucket = "mobile" | "desktop" | "unknown";

export type ShortLinkVisit = {
	date: string;
	referrerBucket: ReferrerBucket;
	deviceBucket: DeviceBucket;
};

export type PublicShortLink = {
	id: string;
	slug: string;
	destinationUrl: string;
};

type ShortLinkHandlerDependencies = {
	findBySlug(slug: string): Promise<PublicShortLink | null>;
	recordVisit(id: string, visit: ShortLinkVisit): Promise<void>;
	runInBackground(task: Promise<unknown>): void;
};

export function parseRedirectDestination(destination: string): URL | null {
	try {
		const url = new URL(destination);
		return url.protocol === "http:" || url.protocol === "https:" ? url : null;
	} catch {
		return null;
	}
}

export function classifyShortLinkRequest(request: Request, now = new Date()): ShortLinkVisit {
	const requestUrl = new URL(request.url);
	const referrer = request.headers.get("referer");
	const userAgent = request.headers.get("user-agent");

	let referrerBucket: ReferrerBucket = "direct";
	if (referrer) {
		try {
			referrerBucket = new URL(referrer).origin === requestUrl.origin ? "internal" : "external";
		} catch {
			referrerBucket = "external";
		}
	}

	let deviceBucket: DeviceBucket = "unknown";
	if (userAgent) {
		deviceBucket = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) ? "mobile" : "desktop";
	}

	return {
		date: now.toISOString().slice(0, 10),
		referrerBucket,
		deviceBucket,
	};
}

export function createShortLinkHandler(dependencies: ShortLinkHandlerDependencies) {
	return async function handleShortLink(request: Request, slug: string): Promise<Response> {
		const link = await dependencies.findBySlug(slug);
		const destination = link ? parseRedirectDestination(link.destinationUrl) : null;

		if (!link || !destination) {
			return new Response("Not found", { status: 404 });
		}

		const analytics = Promise.resolve()
			.then(() => dependencies.recordVisit(link.id, classifyShortLinkRequest(request)))
			.catch(() => undefined);
		dependencies.runInBackground(analytics);

		return Response.redirect(destination, 302);
	};
}
