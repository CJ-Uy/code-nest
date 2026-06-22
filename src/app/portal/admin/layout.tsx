import Link from "next/link";
import { redirect } from "next/navigation";
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
	].filter((tab) => tab.show);

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
			<div className="mb-6">
				<h1 className="font-heading text-3xl text-foreground">Admin</h1>
				<nav className="mt-4 flex flex-wrap gap-2 border-b border-border pb-3">
					{tabs.map((tab) => (
						<Link
							key={tab.href}
							href={tab.href}
							className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
						>
							{tab.label}
						</Link>
					))}
				</nav>
			</div>
			{children}
		</div>
	);
}
