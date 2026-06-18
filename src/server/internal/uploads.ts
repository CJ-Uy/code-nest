import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { crsEvents } from "@/db/schema";
import { uploadsContract } from "@/db/contract/uploads";
import type { DeployEnv } from "@/server/env";
import type { StorageAdapter } from "@/storage/types";
import { createUploadHandlers } from "@/server/uploads";
import { getInternalCorsHeaders } from "./cors";
import { resolveSharedActor } from "./shared-actor";

type UploadsInternalDependencies = {
	db: DrizzleD1Database<typeof schema>;
	deployEnv: DeployEnv;
	storage: StorageAdapter;
	allowedOrigins?: string[];
};

export function createUploadsInternalHandlers({
	db,
	deployEnv,
	storage,
	allowedOrigins = [],
}: UploadsInternalDependencies) {
	const uploads = createUploadHandlers({
		getActor: (request) => resolveSharedActor(db, request),
		storage,
		canPostEvent: async (_actor, eventId) => {
			const [event] = await db
				.select({ status: crsEvents.status })
				.from(crsEvents)
				.where(eq(crsEvents.id, eventId))
				.limit(1);
			return event?.status === "approved";
		},
	});

	return {
		async collection(request: Request): Promise<Response> {
			if (deployEnv !== "dev") return new Response("Not found", { status: 404 });
			return withCors(request, allowedOrigins, () => uploads.collection(request));
		},
		async object(request: Request, key: string): Promise<Response> {
			if (deployEnv !== "dev") return new Response("Not found", { status: 404 });
			return withCors(request, allowedOrigins, async () => {
				if (request.method === "DELETE" && uploadsContract.delete.sharedDev === "deny") {
					return Response.json(
						{ error: "Operation is disabled in shared development." },
						{ status: 403 },
					);
				}
				return uploads.object(request, key);
			});
		},
	};
}

async function withCors(
	request: Request,
	allowedOrigins: string[],
	handler: () => Promise<Response>,
): Promise<Response> {
	const corsHeaders = getInternalCorsHeaders(request, allowedOrigins);
	if (request.method === "OPTIONS") {
		return new Response(null, { status: corsHeaders ? 204 : 403, headers: corsHeaders ?? undefined });
	}
	if (request.headers.has("origin") && !corsHeaders) {
		return Response.json({ error: "Origin is not allowed." }, { status: 403 });
	}

	const response = await handler();
	for (const [name, value] of corsHeaders ?? []) response.headers.set(name, value);
	return response;
}
