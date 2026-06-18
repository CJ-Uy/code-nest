import { describe, expect, it } from "vitest";
import { appEnvSchema, deployEnvSchema, storageModeSchema } from "./env";

describe("environment schemas", () => {
	it("accept the planned app and deploy axes", () => {
		expect(appEnvSchema.options).toEqual(["local", "shared", "production"]);
		expect(deployEnvSchema.options).toEqual(["dev", "prod"]);
		expect(storageModeSchema.options).toEqual(["local", "api", "r2-s3", "binding"]);
	});
});
