import { getRepositories } from "@/db";
import { runInBackground } from "@/server/cloudflare";
import { buildRedirectResponse } from "@/server/links/redirect";

export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ code: string }> },
): Promise<Response> {
	const { code } = await params;
	const { links } = await getRepositories();
	return buildRedirectResponse(
		{
			resolveForRedirect: (slug) => links.resolveForRedirect?.(slug) ?? links.findBySlug(slug),
			recordClick: (linkId, input) => links.recordClick?.(linkId, input) ?? links.recordVisit(linkId, input),
			scheduleBackground: runInBackground,
			previewImageBaseUrl: new URL(request.url).origin,
		},
		request,
		code,
	);
}
