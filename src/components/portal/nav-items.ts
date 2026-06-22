import { CalendarDays, CircleUserRound, House, Bell, Link2, Ticket, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { id: string; label: string; href: string; icon: LucideIcon };

// Fixed core slots shown in the mobile bottom bar, split 2 + raised FAB + 2.
// Keep this at exactly four so the bar stays symmetric around the center FAB.
export const primaryNav: NavItem[] = [
	{ id: "overview", label: "Overview", href: "/portal", icon: House },
	{ id: "calendar", label: "Calendar", href: "/portal/calendar", icon: CalendarDays },
	{ id: "events", label: "Events", href: "/portal/events", icon: Ticket },
	{ id: "profile", label: "Profile", href: "/portal/profile", icon: CircleUserRound },
];

// Links that live inside the desktop sidebar and the mobile "More" sheet, not the
// fixed bar. Later phases append their destinations here (Library, Announcements)
// so the shell component never needs to change to gain a nav entry.
export const secondaryNav: NavItem[] = [
	{ id: "links", label: "Link shortener", href: "/portal/links", icon: Link2 },
	{ id: "notifications", label: "Notifications", href: "/portal/notifications", icon: Bell },
];

// Admin entry is rendered only when the actor has at least one admin scope.
export const adminNav: NavItem = { id: "admin", label: "Admin", href: "/portal/admin", icon: ShieldCheck };
