import { getRepositories } from "@/db";
import { runInBackground } from "@/server/cloudflare";
import { getAppConfig } from "@/server/env";
import { buildRedirectResponse } from "@/server/links/redirect";
import { proxySharedApiRequest } from "@/server/shared-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const config = getAppConfig();
	if (config.APP_ENV === "shared") {
		const slug = new URL(request.url).pathname.replace(/^\/l\//, "");
		return proxySharedApiRequest(request, `/internal/links/redirect/${encodeURIComponent(slug)}`);
	}
	const { links } = await getRepositories();
	return buildRedirectResponse(
		{
			resolveForRedirect: (slug) => links.resolveForRedirect(slug),
			recordClick: (linkId, input) => links.recordClick(linkId, input),
			scheduleBackground: runInBackground,
			previewImageBaseUrl: config.APP_BASE_URL ?? new URL(request.url).origin,
		},
		request,
	);
}
