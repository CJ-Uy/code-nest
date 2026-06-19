import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import { eventsContract } from "@/db/contract/events";
import { createAuditRepository } from "@/db/repositories/audit";
import { createEventsRepository } from "@/db/repositories/events";
import { createRetentionRepository } from "@/db/repositories/retention";
import type { DeployEnv } from "@/server/env";
import { getInternalCorsHeaders } from "./cors";
import { resolveSharedActor } from "./shared-actor";

type EventsInternalDependencies = {
	db: DrizzleD1Database<typeof schema>;
	deployEnv: DeployEnv;
	allowedOrigins?: string[];
};

export function createEventsInternalHandlers({ db, deployEnv, allowedOrigins = [] }: EventsInternalDependencies) {
	const audit = createAuditRepository(db);
	const retention = createRetentionRepository(db, audit);
	const repository = createEventsRepository(db, audit, retention);

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

			try {
				const url = new URL(request.url);
				const op = url.searchParams.get("op") ?? "listApproved";

				if (request.method === "GET" && op === "listApproved") {
					const input = eventsContract.listApproved.input.parse({});
					const events = await repository.listApproved(actor, input);
					return Response.json(eventsContract.listApproved.output.parse({ events }), { headers: responseHeaders });
				}

				if (request.method === "GET" && op === "searchMembers") {
					const input = eventsContract.searchMembers.input.parse({
						eventId: url.searchParams.get("eventId"),
						query: url.searchParams.get("query"),
						limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
					});
					const members = await repository.searchAttendableMembers(actor, input);
					return Response.json(eventsContract.searchMembers.output.parse({ members }), { headers: responseHeaders });
				}

				if (request.method === "POST") {
					const operationDef = eventsContract[op as keyof typeof eventsContract];
					if (!operationDef) {
						return Response.json({ error: "Unknown operation." }, { status: 400, headers: responseHeaders });
					}
					if (operationDef.sharedDev === "deny") {
						return Response.json(
							{ error: "Operation is disabled in shared development." },
							{ status: 403, headers: responseHeaders },
						);
					}
					const body = await request.json();
					if (op === "rsvp") {
						const input = eventsContract.rsvp.input.parse(body);
						const result = await repository.setRsvp(actor, input);
						return Response.json(eventsContract.rsvp.output.parse(result), { headers: responseHeaders });
					}
					return Response.json({ error: "Unknown operation." }, { status: 400, headers: responseHeaders });
				}

				return new Response("Method not allowed", { status: 405, headers: responseHeaders });
			} catch (error) {
				const message = error instanceof Error ? error.message : "Internal request failed.";
				const status = message.startsWith("Not authorized") ? 403 : 400;
				return Response.json({ error: message }, { status, headers: responseHeaders });
			}
		},
	};
}
