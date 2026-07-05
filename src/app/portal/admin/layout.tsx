import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/portal/admin-tabs";
import { getActor } from "@/server/auth/actor";
import { hasAnyAdminScope } from "@/server/auth/admin";
import { visibleGroups } from "./nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const actor = await getActor();
	if (!actor) redirect("/signin");
	if (!hasAnyAdminScope(actor)) redirect("/portal");

	const groups = visibleGroups(actor);

	return (
		<div className="grid gap-6">
			<div className="grid gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-primary">Admin</p>
					<Link href="/portal/admin" className="font-heading text-3xl text-foreground transition-colors hover:text-accent">
						Console
					</Link>
				</div>
				<div className="grid gap-3">
					{groups.map((group) => (
						<div key={group.segment} className="grid gap-1">
							<p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
							<AdminTabs tabs={group.pages.map((page) => ({ href: page.href, label: page.label }))} />
						</div>
					))}
				</div>
			</div>
			{children}
		</div>
	);
}
