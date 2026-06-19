import { NextResponse } from "next/server";
import { getRepositories } from "@/db";
import { getActor } from "@/server/auth/actor";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const actor = await getActor();
	if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	const { id } = await params;
	const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
	if (!query) return NextResponse.json({ members: [] });
	try {
		const repositories = await getRepositories();
		const members = await repositories.events.searchAttendableMembers(actor, { eventId: id, query, limit: 20 });
		return NextResponse.json({ members });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Request failed.";
		const status = message.startsWith("Not authorized") ? 403 : 400;
		return NextResponse.json({ error: message }, { status });
	}
}
