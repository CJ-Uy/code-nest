import { getRepositories } from "@/db";
import { getActor } from "@/server/auth/actor";
import { getAppConfig } from "@/server/env";
import { assertSameOrigin } from "@/server/http/origin";
import { createLinksHandlers } from "@/server/links/handlers";

function handlers() {
	return createLinksHandlers({ getActor, getRepositories });
}

export async function GET(request: Request) {
	return handlers().collection(request);
}

export async function POST(request: Request) {
	const config = getAppConfig();
	try {
		assertSameOrigin(request, config.APP_BASE_URL);
	} catch {
		return Response.json({ error: "Cross-origin request rejected." }, { status: 403 });
	}
	return handlers().collection(request);
}
