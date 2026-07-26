import { redirect } from "next/navigation";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { EventTypeRulesManager } from "./event-type-rules-manager";

export const dynamic = "force-dynamic";

export default async function EventTypesAdminPage() {
	const actor = await requireActor();
	if (!can(actor, "role:assign")) redirect("/portal/admin");
	const repositories = await getRepositories();
	// Shared-dev has no internal proxy for this repo; degrade rather than crash.
	const rules = await repositories.eventTypeRules.list().catch(() => []);
	return <EventTypeRulesManager rules={rules} />;
}
