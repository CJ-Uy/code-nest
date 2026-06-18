export function assertSameOrigin(request: Request, applicationBaseUrl?: string): void {
	const origin = request.headers.get("origin");
	const expectedOrigin = applicationBaseUrl
		? new URL(applicationBaseUrl).origin
		: new URL(request.url).origin;

	if (!origin || origin !== expectedOrigin) {
		throw new Error("Cross-origin request rejected.");
	}
}
