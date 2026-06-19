import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepositories } from "@/db";
import { getActor } from "@/server/auth/actor";
import { getAppConfig } from "@/server/env";
import { assertSameOrigin } from "@/server/http/origin";

const bodySchema = z.object({
	r2Key: z.string().min(1).max(512),
	caption: z.string().trim().max(280).nullable().default(null),
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const actor = await getActor();
	if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	const { id } = await params;
	try {
		const repositories = await getRepositories();
		const media = await repositories.eventMedia.listForEvent(actor, id);
		return NextResponse.json({ media });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Request failed.";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const config = getAppConfig();
	try {
		assertSameOrigin(request, config.APP_BASE_URL);
	} catch {
		return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
	}
	const actor = await getActor();
	if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	const { id } = await params;
	try {
		const { r2Key, caption } = bodySchema.parse(await request.json());
		const repositories = await getRepositories();
		const media = await repositories.eventMedia.add(actor, { eventId: id, r2Key, caption });
		return NextResponse.json({ media }, { status: 201 });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Request failed.";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}
