import { NextResponse } from "next/server";
import { z } from "zod";
import { getRepositories } from "@/db";
import { getActor } from "@/server/auth/actor";
import { getAppConfig } from "@/server/env";
import { assertSameOrigin } from "@/server/http/origin";
import { proxySharedApiRequest } from "@/server/shared-api";

const bodySchema = z.object({ memberId: z.string().min(1), termId: z.string().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const config = getAppConfig();
	try {
		assertSameOrigin(request, config.APP_BASE_URL);
	} catch {
		return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
	}
	const { id } = await params;
	if (config.APP_ENV === "shared") {
		return proxySharedApiRequest(request, `/internal/events?op=scan&eventId=${encodeURIComponent(id)}`);
	}
	const actor = await getActor();
	if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	try {
		const { memberId, termId } = bodySchema.parse(await request.json());
		const repositories = await getRepositories();
		const result = await repositories.events.recordScan(actor, { eventId: id, memberId, termId });
		return NextResponse.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Request failed.";
		const status = message.startsWith("Not authorized") ? 403 : 400;
		return NextResponse.json({ error: message }, { status });
	}
}
