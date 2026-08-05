import type { NextRequest } from "next/server";
import { getFeatureFlags, type FeatureKey } from "@/server/features";

const featurePaths: [FeatureKey, string][] = [
	["retention", "/portal/events"],
	["library", "/portal/library"],
	["announcements", "/portal/announcements"],
	["notifications", "/portal/notifications"],
	["surveys", "/portal/surveys"],
	["library", "/portal/admin/content/library"],
	["announcements", "/portal/admin/content/announcements"],
	["surveys", "/portal/admin/content/surveys"],
	["publicSite", "/contact"],
	["publicSite", "/product"],
	["publicSite", "/projects"],
	["publicSite", "/services"],
];

export function featureForPath(pathname: string): FeatureKey | null {
	return featurePaths.find(([, path]) => pathname === path || pathname.startsWith(`${path}/`))?.[0] ?? null;
}

export function middleware(request: NextRequest): Response | undefined {
	const feature = featureForPath(request.nextUrl.pathname);
	if (feature && !getFeatureFlags()[feature]) return new Response("Not found", { status: 404 });
}
