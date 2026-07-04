import type { Actor, PermissionAction } from "@/server/auth/permissions";
import { can } from "@/server/auth/permissions";

export type AdminPermission = PermissionAction | null;
export type AdminPage = {
	segment: string;
	label: string;
	href: string;
	description: string;
	permission: AdminPermission;
};
export type AdminGroup = { segment: string; label: string; href: string; pages: AdminPage[] };

const G = (segment: string, label: string, pages: Omit<AdminPage, "href">[]): AdminGroup => ({
	segment,
	label,
	href: `/portal/admin/${segment}`,
	pages: pages.map((p) => ({ ...p, href: `/portal/admin/${segment}/${p.segment}` })),
});

export const adminGroups: AdminGroup[] = [
	G("members", "Members & Access", [
		{
			segment: "list",
			label: "Member List",
			description: "Official CODE members this term; adding an email lets that person sign in.",
			permission: "roster:manage",
		},
		{ segment: "roles", label: "Roles & Access", description: "Grant admin roles to members.", permission: "role:assign" },
	]),
	G("content", "Content", [
		{ segment: "announcements", label: "Announcements", description: "Org posts.", permission: "announcement:manage" },
		{ segment: "library", label: "Library", description: "Articles & case studies.", permission: "library:manage" },
		{ segment: "surveys", label: "Surveys", description: "Sampling & questions.", permission: "survey:configure" },
		{
			segment: "submissions",
			label: "Public Submissions",
			description: "Contact inquiries + article feedback from the public site.",
			permission: null,
		},
		{ segment: "links", label: "Short Links", description: "Moderate member short links.", permission: "link:moderate" },
	]),
	G("data", "Data", [
		{ segment: "retention", label: "Log Retention", description: "Record retention/attendance records.", permission: "retention:record" },
		{ segment: "exports", label: "Data Exports", description: "CSV exports of retention data.", permission: "retention:record" },
	]),
	G("system", "System", [
		{ segment: "nav-pins", label: "Pinned Nav Links", description: "Links shown in every member's top nav.", permission: "nav:configure" },
		{
			segment: "quick-links",
			label: "Dashboard Shortcuts",
			description: "Resources in the dashboard Quick Links widget.",
			permission: "nav:configure",
		},
		{ segment: "audit", label: "Activity Log", description: "Recorded admin actions.", permission: null },
	]),
];

const pageVisible = (actor: Actor, p: AdminPage) => p.permission === null || can(actor, p.permission);

export function visibleGroups(actor: Actor): AdminGroup[] {
	return adminGroups
		.map((g) => ({ ...g, pages: g.pages.filter((p) => pageVisible(actor, p)) }))
		.filter((g) => g.pages.length > 0);
}

export function crumbFor(pathname: string): { label: string; href?: string }[] {
	const trail: { label: string; href?: string }[] = [{ label: "Admin", href: "/portal/admin" }];
	const clean = pathname.split("?")[0] ?? "";
	const group = adminGroups.find((g) => clean.startsWith(`${g.href}/`) || clean === g.href);
	if (!group) return trail;
	const onGroupIndex = clean === group.href;
	trail.push({ label: group.label, href: onGroupIndex ? undefined : group.href });
	const page = group.pages.find((p) => clean === p.href || clean.startsWith(`${p.href}/`));
	if (page) trail.push({ label: page.label, href: clean === page.href ? undefined : page.href });
	return trail;
}

/**
 * Header {section, title} for an admin path, derived from the breadcrumb trail.
 * Returns null for non-admin paths so the caller can fall through to its own logic.
 */
export function adminHeading(pathname: string): { section: string; title: string } | null {
	const clean = pathname.split("?")[0] ?? "";
	if (!clean.startsWith("/portal/admin")) return null;
	if (clean === "/portal/admin") return { section: "Admin", title: "Console" };
	const trail = crumbFor(clean);
	if (trail.length < 2) return { section: "Admin", title: "Console" };
	return { section: trail[trail.length - 2].label, title: trail[trail.length - 1].label };
}
