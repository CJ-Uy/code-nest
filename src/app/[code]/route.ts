import { getRepositories } from "@/db";
import { runInBackground } from "@/server/cloudflare";
import { createShortLinkHandler } from "@/server/short-links";

export const dynamic = "force-dynamic";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ code: string }> },
): Promise<Response> {
	const { code } = await params;
	const { links } = await getRepositories();
	const handleShortLink = createShortLinkHandler({
		findBySlug: links.findBySlug,
		recordVisit: links.recordVisit,
		runInBackground,
	});

	return handleShortLink(request, code);
}
