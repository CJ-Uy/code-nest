import { getOptionalCloudflareEnv } from "@/server/cloudflare";
import { getAppConfig } from "@/server/env";
import { D1DatabaseAdapter } from "./adapters/d1";
import { LocalSqliteDatabaseAdapter } from "./adapters/local-sqlite";
import { SharedApiDatabaseAdapter } from "./adapters/shared-api";
import type { DatabaseAdapter } from "./types";

export function getDatabaseAdapter(): DatabaseAdapter {
	const config = getAppConfig();

	if (config.APP_ENV === "production") {
		return new D1DatabaseAdapter();
	}

	if (config.APP_ENV === "shared") {
		return new SharedApiDatabaseAdapter();
	}

	if (getOptionalCloudflareEnv()?.DB) {
		return new D1DatabaseAdapter();
	}

	return new LocalSqliteDatabaseAdapter();
}
