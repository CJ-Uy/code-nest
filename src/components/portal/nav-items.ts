import { CalendarDays, CircleUserRound, House, Bell, BookOpen, Link2, Award, Megaphone, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FeatureFlags } from "@/server/features";

export type NavItem = { id: string; label: string; href: string; icon: LucideIcon };

// Fixed core slots shown in the mobile bottom bar, split 2 + raised FAB + 2.
// Keep this at exactly four so the bar stays symmetric around the center FAB.
export const primaryNav: NavItem[] = [
	{ id: "overview", label: "Overview", href: "/portal", icon: House },
	{ id: "calendar", label: "Calendar", href: "/portal/calendar", icon: CalendarDays },
	// /portal/events currently renders the member retention-history page.
	{ id: "retention", label: "Retention", href: "/portal/events", icon: Award },
	{ id: "profile", label: "Profile", href: "/portal/profile", icon: CircleUserRound },
];

// Links that live inside the desktop sidebar and the mobile "More" sheet, not the
// fixed bar. Later phases append their destinations here (Library, Announcements)
// so the shell component never needs to change to gain a nav entry.
export const secondaryNav: NavItem[] = [
	{ id: "library", label: "Library", href: "/portal/library", icon: BookOpen },
	{ id: "announcements", label: "Announcements", href: "/portal/announcements", icon: Megaphone },
	{ id: "links", label: "Link shortener", href: "/portal/links", icon: Link2 },
	{ id: "notifications", label: "Notifications", href: "/portal/notifications", icon: Bell },
];

export function portalNavigation(flags: FeatureFlags): { primary: NavItem[]; secondary: NavItem[] } {
	const overview = primaryNav.find((item) => item.id === "overview")!;
	const calendar = primaryNav.find((item) => item.id === "calendar")!;
	const retention = primaryNav.find((item) => item.id === "retention")!;
	const profile = primaryNav.find((item) => item.id === "profile")!;
	const links = secondaryNav.find((item) => item.id === "links")!;
	const primary = [overview, calendar, flags.retention ? retention : links, profile];
	const secondary = secondaryNav.filter((item) => {
		if (item.id === "links") return flags.retention;
		if (item.id === "library") return flags.library;
		if (item.id === "announcements") return flags.announcements;
		if (item.id === "notifications") return flags.notifications;
		return true;
	});
	return { primary, secondary };
}

// Admin entry is rendered only when the actor has at least one admin scope.
export const adminNav: NavItem = { id: "admin", label: "Admin", href: "/portal/admin", icon: ShieldCheck };
