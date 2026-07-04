import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Actor } from "@/server/auth/permissions";

export async function getActor(): Promise<Actor | null> {
	const session = await auth();
	if (!session?.user?.id || session.user.status !== "active") return null;
	return { memberId: session.user.id, roles: session.user.roles, context: "session" };
}

export async function requireActor(): Promise<Actor> {
	const actor = await getActor();
	if (!actor) redirect("/signin");
	return actor;
}
