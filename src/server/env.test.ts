import { describe, expect, it } from "vitest";
import { appEnvSchema, deployEnvSchema, getAppConfig, storageModeSchema } from "./env";

describe("environment schemas", () => {
	it("accept the planned app and deploy axes", () => {
		expect(appEnvSchema.options).toEqual(["local", "shared", "production"]);
		expect(deployEnvSchema.options).toEqual(["dev", "prod"]);
		expect(storageModeSchema.options).toEqual(["local", "api", "r2-s3", "binding"]);
	});

	it("does not require authentication secrets for the redirector", () => {
		expect(getAppConfig()).toMatchObject({
			APP_ENV: "production",
			DEPLOY_ENV: "dev",
			STORAGE_MODE: "local",
		});
	});
});
