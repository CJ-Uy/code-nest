import type { AppConfig } from "./env";
import { getAppConfig } from "./env";

export type FeatureKey = "retention" | "library" | "announcements" | "notifications" | "surveys" | "publicSite";
export type FeatureFlags = Record<FeatureKey, boolean>;

type FeatureConfig = Pick<
	AppConfig,
	| "FEATURE_RETENTION"
	| "FEATURE_LIBRARY"
	| "FEATURE_ANNOUNCEMENTS"
	| "FEATURE_NOTIFICATIONS"
	| "FEATURE_SURVEYS"
	| "FEATURE_PUBLIC_SITE"
>;

export function featureFlagsFromConfig(config: FeatureConfig): FeatureFlags {
	return {
		retention: config.FEATURE_RETENTION,
		library: config.FEATURE_LIBRARY,
		announcements: config.FEATURE_ANNOUNCEMENTS,
		notifications: config.FEATURE_NOTIFICATIONS,
		surveys: config.FEATURE_SURVEYS,
		publicSite: config.FEATURE_PUBLIC_SITE,
	};
}

export function getFeatureFlags(): FeatureFlags {
	return featureFlagsFromConfig(getAppConfig());
}

export function assertFeatureEnabled(key: FeatureKey, flags = getFeatureFlags()): void {
	if (!flags[key]) throw new Error("Feature unavailable.");
}
