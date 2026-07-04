import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("legacy short-link route", () => {
	it("301 redirects /l slug URLs to the canonical root slug", async () => {
		const response = await GET(new Request("https://app.example/l/welcome"), { params: Promise.resolve({ slug: "welcome" }) });

		expect(response.status).toBe(301);
		expect(response.headers.get("location")).toBe("https://app.example/welcome");
	});
});
