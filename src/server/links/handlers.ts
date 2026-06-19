import { linksContract } from "@/db/contract/links";
import { linkErrorStatus } from "@/db/repositories/links";
import type { Repositories } from "@/db/repositories";
import type { Actor } from "@/server/auth/permissions";

type LinksHandlerDependencies = {
	getActor(): Promise<Actor | null>;
	getRepositories(): Promise<Repositories>;
};

function fail(error: unknown): Response {
	const message = error instanceof Error ? error.message : "Request failed.";
	return Response.json({ error: message }, { status: linkErrorStatus(error) });
}

export function createLinksHandlers(deps: LinksHandlerDependencies) {
	return {
		async collection(request: Request): Promise<Response> {
			const actor = await deps.getActor();
			if (!actor) return Response.json({ error: "Authentication required." }, { status: 401 });
			const { links } = await deps.getRepositories();

			if (request.method === "GET") {
				const url = new URL(request.url);
				const scope = url.searchParams.get("scope");
				const input = (scope === "all" ? linksContract.listAll : linksContract.listOwn).input.parse({
					limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
					offset: url.searchParams.get("offset") ? Number(url.searchParams.get("offset")) : undefined,
				});
				try {
					const result = scope === "all" ? await links.listAll(actor, input) : await links.listOwn(actor, input);
					return Response.json({ links: result });
				} catch (error) {
					return fail(error);
				}
			}

			if (request.method === "POST") {
				try {
					const input = linksContract.create.input.parse(await request.json());
					const link = await links.create(actor, input);
					return Response.json({ link }, { status: 201 });
				} catch (error) {
					return fail(error);
				}
			}

			return new Response("Method not allowed", { status: 405 });
		},

		async item(request: Request, id: string): Promise<Response> {
			const actor = await deps.getActor();
			if (!actor) return Response.json({ error: "Authentication required." }, { status: 401 });
			const { links } = await deps.getRepositories();

			if (request.method === "GET") {
				try {
					const link = await links.getById(actor, id);
					return Response.json({ link }, { status: link ? 200 : 404 });
				} catch (error) {
					return fail(error);
				}
			}
			if (request.method === "PATCH") {
				try {
					const body = await request.json();
					const input = linksContract.update.input.parse({ ...(body && typeof body === "object" ? body : {}), id });
					const { id: parsedId, ...patch } = input;
					void parsedId;
					const link = await links.update(actor, id, patch);
					return Response.json({ link });
				} catch (error) {
					return fail(error);
				}
			}
			if (request.method === "DELETE") {
				try {
					await links.remove(actor, id);
					return new Response(null, { status: 204 });
				} catch (error) {
					return fail(error);
				}
			}
			return new Response("Method not allowed", { status: 405 });
		},

		async stats(request: Request, id: string): Promise<Response> {
			const actor = await deps.getActor();
			if (!actor) return Response.json({ error: "Authentication required." }, { status: 401 });
			if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
			const { links } = await deps.getRepositories();
			try {
				return Response.json(await links.getStats(actor, id));
			} catch (error) {
				return fail(error);
			}
		},
	};
}
