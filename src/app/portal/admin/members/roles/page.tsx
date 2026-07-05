import { redirect } from "next/navigation";
import { AdminIntro } from "@/components/portal/admin-intro";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { RolesEditor } from "./roles-editor";

export const dynamic = "force-dynamic";

export default async function RolesAccessPage() {
	const actor = await requireActor();
	if (!can(actor, "role:assign")) redirect("/portal/admin");
	const repositories = await getRepositories();
	const assignableRoles = await repositories.roles.listAssignableRoles(actor);

	return (
		<div className="grid gap-4">
			<AdminIntro
				title="Roles & Access"
				whoFor="Give trusted members admin powers by searching for them and toggling roles"
				effect="Changes take effect immediately on the member's next request"
			/>
			<RolesEditor
				assignableRoles={assignableRoles}
				canGrantSuper={actor.roles.includes("super")}
				actorMemberId={actor.memberId}
			/>
		</div>
	);
}
