import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	findBySlug: vi.fn(),
	recordVisit: vi.fn(),
	runInBackground: vi.fn(),
}));

vi.mock("@/db", () => ({
	getRepositories: async () => ({
		links: {
			findBySlug: mocks.findBySlug,
			recordVisit: mocks.recordVisit,
		},
	}),
}));

vi.mock("@/server/cloudflare", () => ({
	runInBackground: mocks.runInBackground,
}));

import { GET } from "./route";

describe("GET /[code]", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.recordVisit.mockResolvedValue(undefined);
	});

	it("redirects an exact production short link", async () => {
		mocks.findBySlug.mockResolvedValue({
			id: "lnk_welcome",
			slug: "welcome",
			destinationUrl: "https://example.com/welcome",
		});

		const response = await GET(new Request("https://code.example/welcome"), {
			params: Promise.resolve({ code: "welcome" }),
		});

		expect(mocks.findBySlug).toHaveBeenCalledWith("welcome");
		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("https://example.com/welcome");
		expect(mocks.runInBackground).toHaveBeenCalledOnce();
	});

	it("returns a plain 404 for an unknown code", async () => {
		mocks.findBySlug.mockResolvedValue(null);

		const response = await GET(new Request("https://code.example/unknown"), {
			params: Promise.resolve({ code: "unknown" }),
		});

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("Not found");
	});
});
