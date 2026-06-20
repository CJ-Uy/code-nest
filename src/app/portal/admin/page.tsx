import Link from "next/link";
import { ExternalLink, Settings } from "lucide-react";
import { getRepositories } from "@/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
	const actor = await requireActor();
	const repositories = await getRepositories();
	const quickLinks = can(actor, "nav:configure") ? await repositories.quickLinks.list(actor) : [];
	const modules = [
		{ href: "/portal/admin/reporting", label: "Reporting", show: can(actor, "retention:record") },
		{ href: "/portal/admin/roster", label: "Roster", show: can(actor, "roster:manage") },
		{ href: "/portal/admin/nav-pins", label: "Nav pins", show: can(actor, "nav:configure") },
		{ href: "/portal/admin/quick-links", label: "Quick links", show: can(actor, "nav:configure") },
		{ href: "/portal/admin/links", label: "Short links", show: can(actor, "link:moderate") },
		{ href: "/portal/admin/surveys", label: "Surveys", show: can(actor, "survey:configure") },
	].filter((module) => module.show);

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Admin modules</CardTitle>
					<CardDescription>Tools available for your current role.</CardDescription>
				</CardHeader>
				<CardContent className="grid gap-2">
					{modules.map((module) => (
						<Link
							key={module.href}
							href={module.href}
							className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
						>
							<Settings className="size-4" />
							{module.label}
						</Link>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Quick links</CardTitle>
					<CardDescription>Shared resources surfaced on the member dashboard.</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					{quickLinks.length === 0 ? (
						<p className="text-sm text-muted-foreground">No quick links yet.</p>
					) : (
						quickLinks.map((link) => (
							<a
								key={link.id}
								href={link.url}
								className="flex items-center gap-2 text-sm hover:text-primary"
								target="_blank"
								rel="noreferrer"
							>
								<ExternalLink className="size-4" />
								{link.label}
							</a>
						))
					)}
					{can(actor, "nav:configure") ? (
						<Link href="/portal/admin/quick-links" className="mt-2 text-sm text-primary hover:underline">
							Manage quick links
						</Link>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
