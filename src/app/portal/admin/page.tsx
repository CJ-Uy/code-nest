import Link from "next/link";
import { AdminIntro } from "@/components/portal/admin-intro";
import { requireActor } from "@/server/auth/actor";
import { visibleGroups } from "./nav";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
	const actor = await requireActor();
	const groups = visibleGroups(actor);

	return (
		<div className="grid gap-4">
			<AdminIntro title="Admin Console" whoFor="Use the tools your role can access" effect="Changes apply to production data" />
			<div className="grid gap-3 sm:grid-cols-2">
				{groups.map((group) => (
					<Link key={group.href} href={group.href} className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent">
						<p className="font-medium group-hover:text-accent">{group.label}</p>
						<p className="mt-1 text-sm text-muted-foreground">{group.pages.map((page) => page.label).join(", ")}</p>
					</Link>
				))}
			</div>
		</div>
	);
}
