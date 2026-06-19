import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { retentionContract } from "@/db/contract/retention";
import { createAuditRepository } from "@/db/repositories/audit";
import { createRetentionRepository } from "@/db/repositories/retention";
import type { DeployEnv } from "@/server/env";
import { getInternalCorsHeaders } from "./cors";
import { resolveSharedActor } from "./shared-actor";

type RetentionInternalDependencies = {
	db: DrizzleD1Database<typeof schema>;
	deployEnv: DeployEnv;
	allowedOrigins?: string[];
};

export function createRetentionInternalHandlers({ db, deployEnv, allowedOrigins = [] }: RetentionInternalDependencies) {
	const repository = createRetentionRepository(db, createAuditRepository(db));

	return {
		async fetch(request: Request): Promise<Response> {
			if (deployEnv !== "dev") return new Response("Not found", { status: 404 });

			const corsHeaders = getInternalCorsHeaders(request, allowedOrigins);
			if (request.method === "OPTIONS") {
				return new Response(null, { status: corsHeaders ? 204 : 403, headers: corsHeaders ?? undefined });
			}
			if (request.headers.has("origin") && !corsHeaders) {
				return Response.json({ error: "Origin is not allowed." }, { status: 403 });
			}
			const responseHeaders = corsHeaders ?? undefined;

			const actor = await resolveSharedActor(db, request);
			if (!actor) {
				return Response.json({ error: "Invalid shared development token." }, { status: 401, headers: responseHeaders });
			}

			if (request.method !== "POST") {
				return new Response("Method not allowed", { status: 405, headers: responseHeaders });
			}

			if (retentionContract.createManual.sharedDev === "deny") {
				return Response.json(
					{ error: "Operation is disabled in shared development." },
					{ status: 403, headers: responseHeaders },
				);
			}

			try {
				const input = retentionContract.createManual.input.parse(await request.json());
				const result = await repository.createManual(actor, input);
				const output = retentionContract.createManual.output.parse(result);
				return Response.json(output, { status: 201, headers: responseHeaders });
			} catch (error) {
				const message = error instanceof Error ? error.message : "Internal request failed.";
				const status = message.startsWith("Not authorized") ? 403 : 400;
				return Response.json({ error: message }, { status, headers: responseHeaders });
			}
		},
	};
}
