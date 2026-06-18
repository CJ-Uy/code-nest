import { NextResponse } from "next/server";
import { getDatabaseAdapter } from "@/db";
import { createMemberInputSchema } from "@/db/types";

export async function GET() {
	const db = getDatabaseAdapter();
	const members = await db.listMembers();
	return NextResponse.json({ members });
}

export async function POST(request: Request) {
	const parsed = createMemberInputSchema.safeParse(await request.json().catch(() => null));

	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid member input." }, { status: 400 });
	}

	const db = getDatabaseAdapter();
	const member = await db.createMember(parsed.data);
	return NextResponse.json({ member }, { status: 201 });
}
