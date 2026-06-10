import { NextResponse } from "next/server";
import { getDatabaseAdapter } from "@/db";
import { createUserInputSchema } from "@/db/types";

export async function GET() {
	const db = getDatabaseAdapter();
	const users = await db.listUsers();
	return NextResponse.json({ users });
}

export async function POST(request: Request) {
	const parsed = createUserInputSchema.safeParse(await request.json().catch(() => null));

	if (!parsed.success) {
		return NextResponse.json({ error: "Invalid user input." }, { status: 400 });
	}

	const db = getDatabaseAdapter();
	const user = await db.createUser(parsed.data);
	return NextResponse.json({ user }, { status: 201 });
}
