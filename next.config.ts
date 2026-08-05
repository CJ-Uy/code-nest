import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["127.0.0.1"],
	output: "standalone",
	outputFileTracingRoot: process.cwd(),
};

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
if (process.env.E2E_AUTH_BYPASS !== "1") {
	// E2E uses the local SQLite database and env values supplied by Playwright.
	initOpenNextCloudflareForDev();
}
