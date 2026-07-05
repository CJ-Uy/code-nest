import { redirect } from "next/navigation";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { NavPinsManager } from "./nav-pins-manager";

export const dynamic = "force-dynamic";

export default async function NavPinsAdminPage() {
	const actor = await requireActor();
	if (!can(actor, "nav:configure")) redirect("/portal/admin");
	const repositories = await getRepositories();
	// nav pins has no shared-dev internal proxy yet; degrade to an empty list instead of crashing.
	const pins = await repositories.navPins.list(actor).catch(() => []);

	return <NavPinsManager key={pins.map((pin) => `${pin.id}:${pin.position}`).join("|")} pins={pins} />;
}
