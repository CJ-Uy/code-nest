import { getRepositories } from "@/db";
import { LinksWorkspace } from "@/components/links/links-workspace";
import { requireActor } from "@/server/auth/actor";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
	const actor = await requireActor();
	const { links } = await getRepositories();
	const visibleLinks = await links.listVisible(actor, { limit: 50 });
	const canModerate = actor.roles.includes("link") || actor.roles.includes("super");
	return <LinksWorkspace initialLinks={visibleLinks} actorMemberId={actor.memberId} canModerate={canModerate} />;
}
