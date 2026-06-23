import { redirect } from "next/navigation";
import { AdminTabs } from "@/components/portal/admin-tabs";
import { getActor } from "@/server/auth/actor";
import { hasAnyAdminScope } from "@/server/auth/admin";
import { can } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const actor = await getActor();
	if (!actor) redirect("/signin");
	if (!hasAnyAdminScope(actor)) redirect("/portal");

	const tabs = [
		{ href: "/portal/admin", label: "Dashboard", show: true },
		{ href: "/portal/admin/reporting", label: "Reporting", show: can(actor, "retention:record") },
		{ href: "/portal/admin/retention", label: "Retention", show: can(actor, "retention:record") },
		{ href: "/portal/admin/roster", label: "Roster", show: can(actor, "roster:manage") },
		{ href: "/portal/admin/nav-pins", label: "Nav pins", show: can(actor, "nav:configure") },
		{ href: "/portal/admin/quick-links", label: "Quick links", show: can(actor, "nav:configure") },
		{ href: "/portal/admin/links", label: "Links", show: can(actor, "link:moderate") },
		{ href: "/portal/admin/surveys", label: "Surveys", show: can(actor, "survey:configure") },
		{ href: "/portal/admin/announcements", label: "Announcements", show: can(actor, "announcement:manage") },
		{ href: "/portal/admin/library", label: "Library", show: can(actor, "library:manage") },
		{ href: "/portal/admin/audit", label: "Audit log", show: true },
	].filter((tab) => tab.show);

	return (
		<div className="grid gap-6">
			<div className="grid gap-4">
				<div>
					<p className="text-xs font-semibold uppercase tracking-wide text-primary">Admin</p>
					<h1 className="font-heading text-3xl text-foreground">Console</h1>
				</div>
				<AdminTabs tabs={tabs} />
			</div>
			{children}
		</div>
	);
}
