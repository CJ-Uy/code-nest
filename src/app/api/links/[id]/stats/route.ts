import { getRepositories } from "@/db";
import { getActor } from "@/server/auth/actor";
import { createLinksHandlers } from "@/server/links/handlers";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
	const { id } = await context.params;
	return createLinksHandlers({ getActor, getRepositories }).stats(request, id);
}
