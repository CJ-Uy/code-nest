import { describe, expect, it, vi } from "vitest";
import {
	classifyShortLinkRequest,
	createShortLinkHandler,
	parseRedirectDestination,
} from "./short-links";

describe("parseRedirectDestination", () => {
	it("accepts HTTP and HTTPS destinations", () => {
		expect(parseRedirectDestination("https://example.com/path")?.href).toBe("https://example.com/path");
		expect(parseRedirectDestination("http://example.com/path")?.href).toBe("http://example.com/path");
	});

	it("rejects unsafe or malformed destinations", () => {
		expect(parseRedirectDestination("javascript:alert(1)")).toBeNull();
		expect(parseRedirectDestination("mailto:test@example.com")).toBeNull();
		expect(parseRedirectDestination("not a URL")).toBeNull();
	});
});

describe("classifyShortLinkRequest", () => {
	it("uses UTC dates and direct/unknown buckets when headers are absent", () => {
		const request = new Request("https://code.example/welcome");
		expect(classifyShortLinkRequest(request, new Date("2026-06-18T23:59:59.000Z"))).toEqual({
			date: "2026-06-18",
			referrerBucket: "direct",
			deviceBucket: "unknown",
		});
	});

	it("distinguishes internal and external referrers", () => {
		const internal = new Request("https://code.example/welcome", {
			headers: { referer: "https://code.example/page", "user-agent": "Mozilla/5.0 Windows" },
		});
		const external = new Request("https://code.example/welcome", {
			headers: { referer: "https://search.example/result", "user-agent": "Mozilla/5.0 iPhone Mobile" },
		});

		expect(classifyShortLinkRequest(internal).referrerBucket).toBe("internal");
		expect(classifyShortLinkRequest(internal).deviceBucket).toBe("desktop");
		expect(classifyShortLinkRequest(external).referrerBucket).toBe("external");
		expect(classifyShortLinkRequest(external).deviceBucket).toBe("mobile");
	});
});

describe("createShortLinkHandler", () => {
	it("redirects valid links and schedules analytics without awaiting them", async () => {
		let resolveAnalytics: (() => void) | undefined;
		const analytics = new Promise<void>((resolve) => {
			resolveAnalytics = resolve;
		});
		const runInBackground = vi.fn();
		const handler = createShortLinkHandler({
			findBySlug: async () => ({
				id: "lnk_welcome",
				slug: "welcome",
				destinationUrl: "https://example.com/welcome",
			}),
			recordVisit: async () => analytics,
			runInBackground,
		});

		const response = await handler(new Request("https://code.example/welcome"), "welcome");

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("https://example.com/welcome");
		expect(runInBackground).toHaveBeenCalledWith(expect.any(Promise));
		resolveAnalytics?.();
	});

	it("redirects even when analytics recording fails", async () => {
		const handler = createShortLinkHandler({
			findBySlug: async () => ({
				id: "lnk_welcome",
				slug: "welcome",
				destinationUrl: "https://example.com/welcome",
			}),
			recordVisit: async () => {
				throw new Error("analytics unavailable");
			},
			runInBackground: vi.fn(),
		});

		const response = await handler(new Request("https://code.example/welcome"), "welcome");

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("https://example.com/welcome");
	});

	it("returns 404 for missing or invalid links", async () => {
		const recordVisit = vi.fn();
		const missing = createShortLinkHandler({
			findBySlug: async () => null,
			recordVisit,
			runInBackground: vi.fn(),
		});
		const invalid = createShortLinkHandler({
			findBySlug: async () => ({
				id: "lnk_bad",
				slug: "bad",
				destinationUrl: "javascript:alert(1)",
			}),
			recordVisit,
			runInBackground: vi.fn(),
		});

		await expect(missing(new Request("https://code.example/nope"), "nope")).resolves.toMatchObject({ status: 404 });
		await expect(invalid(new Request("https://code.example/bad"), "bad")).resolves.toMatchObject({ status: 404 });
		expect(recordVisit).not.toHaveBeenCalled();
	});
});
