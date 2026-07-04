export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
	const { slug } = await context.params;
	const url = new URL(request.url);
	return Response.redirect(new URL(`/${encodeURIComponent(slug)}`, url.origin), 301);
}
