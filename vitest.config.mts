import path from "node:path";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": path.resolve(import.meta.dirname, "src"),
		},
	},
	plugins: [
		cloudflareTest(async () => ({
			main: "./src/test-worker.ts",
			miniflare: {
				compatibilityDate: "2026-06-10",
				compatibilityFlags: ["nodejs_compat"],
				d1Databases: {
					DB: "code-portal-test-db",
				},
				bindings: {
					APP_ENV: "production",
					DEPLOY_ENV: "dev",
					STORAGE_MODE: "local",
					AUTH_SECRET: "test-auth-secret",
					AUTH_GOOGLE_ID: "test-google-id",
					AUTH_GOOGLE_SECRET: "test-google-secret",
					TEST_MIGRATIONS: await readD1Migrations(path.join(import.meta.dirname, "drizzle/migrations")),
				},
			},
		})),
	],
	test: {
		globals: false,
		include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
		setupFiles: ["./src/test/setup-d1.ts"],
	},
});
