import { redirect } from "next/navigation";
import { AdminIntro } from "@/components/portal/admin-intro";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { RolesManager } from "./roles-editor";

export const dynamic = "force-dynamic";

export default async function RolesAccessPage() {
	const actor = await requireActor();
	if (!can(actor, "role:assign")) redirect("/portal/admin");
	const repositories = await getRepositories();
	const [assignableRoles, admins] = await Promise.all([
		repositories.roles.listAssignableRoles(actor),
		repositories.roles.listAdmins(actor),
	]);

	return (
		<div className="grid gap-4">
			<AdminIntro
				title="Roles & Access"
				whoFor="See who has admin access, and grant or change roles"
				effect="Changes take effect immediately on the member's next request"
			/>
			<RolesManager
				admins={admins}
				assignableRoles={assignableRoles}
				canGrantSuper={actor.roles.includes("super")}
				actorMemberId={actor.memberId}
			/>
		</div>
	);
}
