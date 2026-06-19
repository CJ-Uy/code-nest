import { CalendarDays, CircleUserRound, House, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { id: string; label: string; href: string; icon: LucideIcon };

// Fixed core slots. The mobile bottom bar shows these plus a center Menu button.
// Keep this at four entries or fewer so the bar stays at the ~4-5 slot budget.
export const primaryNav: NavItem[] = [
	{ id: "overview", label: "Overview", href: "/portal", icon: House },
	{ id: "calendar", label: "Calendar", href: "/portal/calendar", icon: CalendarDays },
	{ id: "profile", label: "Profile", href: "/portal/profile", icon: CircleUserRound },
];

// Links that live inside the desktop sidebar and the mobile Menu sheet, not the fixed bar.
export const sheetNav: NavItem[] = [
	{ id: "notifications", label: "Notifications", href: "/portal/notifications", icon: Bell },
];
