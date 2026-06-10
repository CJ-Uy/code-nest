import { z } from "zod";
import { getOptionalCloudflareEnv } from "./cloudflare";

const appEnvSchema = z.enum(["local", "shared", "production"]);
const storageModeSchema = z.enum(["local", "api", "r2-s3", "binding"]);

const rawEnvSchema = z.object({
	APP_ENV: appEnvSchema.default("local"),
	STORAGE_MODE: storageModeSchema.default("local"),
	ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE: z.string().optional(),
	SHARED_API_BASE_URL: z.string().optional(),
	SHARED_API_TOKEN: z.string().optional(),
	R2_ACCOUNT_ID: z.string().optional(),
	R2_BUCKET_NAME: z.string().optional(),
	R2_ACCESS_KEY_ID: z.string().optional(),
	R2_SECRET_ACCESS_KEY: z.string().optional(),
	R2_ENDPOINT: z.string().optional(),
	LOCAL_SQLITE_PATH: z.string().default("./.local/dev.db"),
	LOCAL_STORAGE_DIR: z.string().default("./.local/uploads"),
});

export type AppConfig = z.infer<typeof rawEnvSchema>;
export type AppEnv = AppConfig["APP_ENV"];
export type StorageMode = AppConfig["STORAGE_MODE"];

function runtimeEnvValue(key: keyof AppConfig): string | undefined {
	const cloudflareEnv = getOptionalCloudflareEnv() as Partial<Record<keyof AppConfig, string>> | null;
	return cloudflareEnv?.[key] ?? process.env[key];
}

export function getAppConfig(): AppConfig {
	const parsed = rawEnvSchema.parse({
		APP_ENV: runtimeEnvValue("APP_ENV"),
		STORAGE_MODE: runtimeEnvValue("STORAGE_MODE"),
		ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE: runtimeEnvValue("ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE"),
		SHARED_API_BASE_URL: runtimeEnvValue("SHARED_API_BASE_URL"),
		SHARED_API_TOKEN: runtimeEnvValue("SHARED_API_TOKEN"),
		R2_ACCOUNT_ID: runtimeEnvValue("R2_ACCOUNT_ID"),
		R2_BUCKET_NAME: runtimeEnvValue("R2_BUCKET_NAME"),
		R2_ACCESS_KEY_ID: runtimeEnvValue("R2_ACCESS_KEY_ID"),
		R2_SECRET_ACCESS_KEY: runtimeEnvValue("R2_SECRET_ACCESS_KEY"),
		R2_ENDPOINT: runtimeEnvValue("R2_ENDPOINT"),
		LOCAL_SQLITE_PATH: runtimeEnvValue("LOCAL_SQLITE_PATH"),
		LOCAL_STORAGE_DIR: runtimeEnvValue("LOCAL_STORAGE_DIR"),
	});

	const issues: string[] = [];

	if (parsed.APP_ENV === "shared") {
		if (!parsed.SHARED_API_BASE_URL) issues.push("SHARED_API_BASE_URL is required when APP_ENV=shared.");
		if (!parsed.SHARED_API_TOKEN) issues.push("SHARED_API_TOKEN is required when APP_ENV=shared.");
	}

	if (parsed.STORAGE_MODE === "r2-s3") {
		for (const key of ["R2_ACCOUNT_ID", "R2_BUCKET_NAME", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT"] as const) {
			if (!parsed[key]) issues.push(`${key} is required when STORAGE_MODE=r2-s3.`);
		}
	}

	if (issues.length > 0) {
		throw new Error(issues.join(" "));
	}

	return parsed;
}

export function getPublicEnvStatus() {
	const config = getAppConfig();

	return {
		APP_ENV: config.APP_ENV,
		STORAGE_MODE: config.STORAGE_MODE,
		requiredEnv: {
			SHARED_API_BASE_URL: Boolean(config.SHARED_API_BASE_URL),
			SHARED_API_TOKEN: Boolean(config.SHARED_API_TOKEN),
			R2_ACCOUNT_ID: Boolean(config.R2_ACCOUNT_ID),
			R2_BUCKET_NAME: Boolean(config.R2_BUCKET_NAME),
			R2_ACCESS_KEY_ID: Boolean(config.R2_ACCESS_KEY_ID),
			R2_SECRET_ACCESS_KEY: Boolean(config.R2_SECRET_ACCESS_KEY),
			R2_ENDPOINT: Boolean(config.R2_ENDPOINT),
			LOCAL_SQLITE_PATH: Boolean(config.LOCAL_SQLITE_PATH),
			LOCAL_STORAGE_DIR: Boolean(config.LOCAL_STORAGE_DIR),
		},
	};
}
