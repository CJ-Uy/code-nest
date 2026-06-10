import { getOptionalCloudflareEnv } from "@/server/cloudflare";
import { getAppConfig } from "@/server/env";
import { LocalFileStorageAdapter } from "./adapters/local-fs";
import { R2BindingStorageAdapter } from "./adapters/r2-binding";
import { R2S3StorageAdapter } from "./adapters/r2-s3";
import { SharedApiStorageAdapter } from "./adapters/shared-api";
import type { StorageAdapter } from "./types";

export function getStorageAdapter(): StorageAdapter {
	const config = getAppConfig();

	if (config.APP_ENV === "production" && config.ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE !== "true") {
		return new R2BindingStorageAdapter();
	}

	if (config.STORAGE_MODE === "binding") {
		return new R2BindingStorageAdapter();
	}

	if (config.STORAGE_MODE === "r2-s3") {
		return new R2S3StorageAdapter();
	}

	if (config.STORAGE_MODE === "api") {
		return new SharedApiStorageAdapter();
	}

	if (config.APP_ENV === "local" && getOptionalCloudflareEnv()?.BUCKET) {
		return new R2BindingStorageAdapter();
	}

	return new LocalFileStorageAdapter();
}
