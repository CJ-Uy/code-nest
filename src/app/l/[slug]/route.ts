import { getRepositories } from "@/db";
import { runInBackground } from "@/server/cloudflare";
import { getAppConfig } from "@/server/env";
import { buildRedirectResponse } from "@/server/links/redirect";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	const config = getAppConfig();
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
