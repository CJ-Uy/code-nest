import { getCloudflareContext } from "@opennextjs/cloudflare";

export type CloudflareRuntimeEnv = CloudflareEnv & {
	APP_ENV?: string;
	STORAGE_MODE?: string;
	ALLOW_PRODUCTION_STORAGE_MODE_OVERRIDE?: string;
};

export function getCloudflareEnv(): CloudflareRuntimeEnv {
	const { env } = getCloudflareContext();
	return env as CloudflareRuntimeEnv;
}

export function getOptionalCloudflareEnv(): CloudflareRuntimeEnv | null {
	try {
		return getCloudflareEnv();
	} catch {
		return null;
	}
}

export function hasCloudflareBinding(name: "DB" | "BUCKET"): boolean {
	const env = getOptionalCloudflareEnv();
	return Boolean(env?.[name]);
}
