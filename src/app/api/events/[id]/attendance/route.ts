import { NextResponse } from "next/server";
import { getRepositories } from "@/db";
import { getActor } from "@/server/auth/actor";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	const actor = await getActor();
	if (!actor) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
	const { id } = await params;
	try {
		const repositories = await getRepositories();
		const attendance = await repositories.events.listAttendance(actor, id);
		return NextResponse.json({ attendance });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Request failed.";
		const status = message.startsWith("Not authorized") ? 403 : 400;
		return NextResponse.json({ error: message }, { status });
	}
}
