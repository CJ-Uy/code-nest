import { Link2, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = { id: string; label: string; href: string; icon: LucideIcon };

export const primaryNav: NavItem[] = [
	{ id: "links", label: "Link shortener", href: "/portal/links", icon: Link2 },
];

export const secondaryNav: NavItem[] = [];

// Admin entry is rendered only when the actor has at least one admin scope.
export const adminNav: NavItem = { id: "admin", label: "Admin", href: "/portal/admin", icon: ShieldCheck };
