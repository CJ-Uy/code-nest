import Link from "next/link";
import {
	BarChart3,
	BookOpen,
	ExternalLink,
	Link2,
	Megaphone,
	Pin,
	ScrollText,
	Users,
	ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getRepositories } from "@/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

type AdminModule = { href: string; label: string; description: string; icon: LucideIcon; show: boolean };

export default async function AdminDashboardPage() {
	const actor = await requireActor();
	const repositories = await getRepositories();
	// quick links has no shared-dev internal proxy yet; degrade to an empty list instead of crashing.
	const quickLinks = can(actor, "nav:configure")
		? await repositories.quickLinks.list(actor).catch(() => [])
		: [];
	const modules: AdminModule[] = [
		{ href: "/portal/admin/reporting", label: "Reporting", description: "Retention dashboards", icon: BarChart3, show: can(actor, "retention:record") },
		{ href: "/portal/admin/roster", label: "Roster", description: "Members and roles", icon: Users, show: can(actor, "roster:manage") },
		{ href: "/portal/admin/announcements", label: "Announcements", description: "Org posts", icon: Megaphone, show: can(actor, "announcement:manage") },
		{ href: "/portal/admin/library", label: "Library", description: "Articles and case studies", icon: BookOpen, show: can(actor, "library:manage") },
		{ href: "/portal/admin/surveys", label: "Surveys", description: "Sampling and questions", icon: ClipboardList, show: can(actor, "survey:configure") },
		{ href: "/portal/admin/links", label: "Short links", description: "Moderate links", icon: Link2, show: can(actor, "link:moderate") },
		{ href: "/portal/admin/nav-pins", label: "Nav pins", description: "Pinned destinations", icon: Pin, show: can(actor, "nav:configure") },
		{ href: "/portal/admin/audit", label: "Audit log", description: "Recorded actions", icon: ScrollText, show: true },
	].filter((module) => module.show);

	return (
		<div className="grid gap-6">
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{modules.map((module) => {
					const Icon = module.icon;
					return (
						<Link
							key={module.href}
							href={module.href}
							className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent"
						>
							<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-accent">
								<Icon className="size-5" />
							</span>
							<span className="min-w-0">
								<span className="block font-medium group-hover:text-accent">{module.label}</span>
								<span className="block text-sm text-muted-foreground">{module.description}</span>
							</span>
						</Link>
					);
				})}
			</div>

			{can(actor, "nav:configure") ? (
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
						<Link href="/portal/admin/quick-links" className="mt-2 text-sm text-primary hover:underline">
							Manage quick links
						</Link>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
