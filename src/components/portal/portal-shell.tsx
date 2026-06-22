"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, LogOut, Plus } from "lucide-react";
import { MemberCodeCard } from "@/components/member-code-card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "./member-avatar";
import { adminNav, primaryNav, secondaryNav, type NavItem } from "./nav-items";

export type PortalShellProps = {
	member: { displayName: string; initials: string; subtitle?: string };
	memberId: string;
	navPins: { id: string; label: string; url: string }[];
	showAdmin: boolean;
	bell: React.ReactNode;
	signOutAction: () => Promise<void>;
	children: React.ReactNode;
};

function isActive(pathname: string, href: string): boolean {
	return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}

function RailItem({ item, pathname }: { item: NavItem; pathname: string }) {
	const Icon = item.icon;
	const on = isActive(pathname, item.href);
	return (
		<Link
			href={item.href}
			className={cn(
				"relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
				on ? "bg-white/10 text-primary-foreground" : "text-primary-foreground/65 hover:text-primary-foreground",
			)}
		>
			{on ? (
				<span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-secondary" aria-hidden />
			) : null}
			<Icon className="size-5" />
			<span className="flex-1">{item.label}</span>
			{item.id === "admin" ? (
				<span className="rounded-full bg-white/15 px-2 py-0.5 text-[0.6rem] font-bold tracking-wide text-accent-foreground">
					ADMIN
				</span>
			) : null}
		</Link>
	);
}

export function PortalShell({ member, memberId, navPins, showAdmin, bell, signOutAction, children }: PortalShellProps) {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	const railSecondary: NavItem[] = [...secondaryNav, ...(showAdmin ? [adminNav] : [])];
	const sheetItems: NavItem[] = railSecondary;
	const leftTabs = primaryNav.slice(0, 2);
	const rightTabs = primaryNav.slice(2, 4);

	return (
		<div className="min-h-screen bg-background text-foreground lg:flex">
			{/* Desktop sidebar rail */}
			<aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 bg-primary px-4 py-6 text-primary-foreground lg:flex">
				<Link href="/portal" className="mb-4 flex items-center gap-2 px-2">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src="/code-logo-full-white.png" alt="Ateneo CODE" className="h-8 w-auto" />
				</Link>
				<nav className="flex flex-col gap-1" aria-label="Portal modules">
					{primaryNav.map((item) => (
						<RailItem key={item.id} item={item} pathname={pathname} />
					))}
				</nav>
				<Separator className="my-3 bg-white/10" />
				<nav className="flex flex-col gap-1" aria-label="More modules">
					{railSecondary.map((item) => (
						<RailItem key={item.id} item={item} pathname={pathname} />
					))}
					{navPins.map((pin) => (
						<a
							key={pin.id}
							href={pin.url}
							target="_blank"
							rel="noreferrer"
							className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary-foreground/65 transition-colors hover:text-primary-foreground"
						>
							<ChevronRight className="size-5" />
							<span className="flex-1 truncate">{pin.label}</span>
						</a>
					))}
				</nav>
				<div className="mt-auto flex flex-col gap-1">
					<Separator className="my-2 bg-white/10" />
					<div className="flex items-center gap-3 px-3 py-2">
						<MemberAvatar initials={member.initials} />
						<div className="min-w-0 flex-1 leading-tight">
							<p className="truncate text-sm font-semibold text-primary-foreground">{member.displayName}</p>
							{member.subtitle ? <p className="truncate text-xs text-primary-foreground/60">{member.subtitle}</p> : null}
						</div>
					</div>
					<form action={signOutAction}>
						<button
							type="submit"
							className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary-foreground/65 transition-colors hover:text-primary-foreground"
						>
							<LogOut className="size-5" />
							Sign out
						</button>
					</form>
				</div>
			</aside>

			<div className="flex min-h-screen w-full min-w-0 flex-col">
				{/* Top bar: navy app bar on mobile, light utility bar on desktop. */}
				<header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-primary px-4 py-3 text-primary-foreground sm:px-6 lg:border-b lg:border-border lg:bg-card lg:text-card-foreground lg:px-8">
					<Link href="/portal" className="lg:hidden">
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img src="/code-logo-full-white.png" alt="Ateneo CODE" className="h-7 w-auto" />
					</Link>
					<span className="hidden text-sm text-muted-foreground lg:inline lg:flex-1">
						Welcome back, {member.displayName}
					</span>
					<div className="flex items-center gap-2">
						{bell}
						<span className="hidden lg:inline">
							<MemberAvatar initials={member.initials} className="bg-primary text-primary-foreground" />
						</span>
					</div>
				</header>

				<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
			</div>

			{/* Mobile bottom nav with a raised center FAB that opens the "More" sheet. */}
			<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
				<nav
					className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-primary text-primary-foreground lg:hidden"
					aria-label="Portal modules"
				>
					<div className="relative mx-auto flex h-16 max-w-md items-center justify-around px-1">
						{leftTabs.map((item) => (
							<BarTab key={item.id} item={item} pathname={pathname} />
						))}
						{/* spacer reserving room for the FAB */}
						<span className="w-16 shrink-0" aria-hidden />
						{rightTabs.map((item) => (
							<BarTab key={item.id} item={item} pathname={pathname} />
						))}

						<SheetTrigger asChild>
							<button
								type="button"
								aria-label="Open menu"
								aria-expanded={menuOpen}
								className={cn(
									"absolute -top-6 left-1/2 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-secondary text-primary shadow-lg ring-4 ring-background transition-transform duration-200 active:scale-90",
									menuOpen && "rotate-45",
								)}
							>
								<Plus className="size-7" />
							</button>
						</SheetTrigger>
					</div>
				</nav>

				<SheetContent
					side="bottom"
					className="max-h-[82vh] gap-0 overflow-y-auto rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
				>
					<span className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border" aria-hidden />
					<SheetTitle className="px-5 pt-3 font-heading text-xl">Menu</SheetTitle>

					<div className="px-4 pt-4">
						<MemberCodeCard memberId={memberId} />
					</div>

					<nav className="flex flex-col px-2 pt-3" aria-label="More modules">
						{sheetItems.map((item) => {
							const Icon = item.icon;
							return (
								<SheetClose asChild key={item.id}>
									<Link
										href={item.href}
										className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-muted"
									>
										<span className="grid size-9 place-items-center rounded-lg bg-secondary text-accent">
											<Icon className="size-5" />
										</span>
										<span className="flex-1">{item.label}</span>
										<ChevronRight className="size-4 text-muted-foreground" />
									</Link>
								</SheetClose>
							);
						})}
						{navPins.map((pin) => (
							<SheetClose asChild key={pin.id}>
								<a
									href={pin.url}
									target="_blank"
									rel="noreferrer"
									className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-muted"
								>
									<span className="grid size-9 place-items-center rounded-lg bg-secondary text-accent">
										<ChevronRight className="size-5" />
									</span>
									<span className="flex-1 truncate">{pin.label}</span>
								</a>
							</SheetClose>
						))}
					</nav>

					<div className="mt-2 border-t border-border px-2 pt-2">
						<form action={signOutAction}>
							<button
								type="submit"
								className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-destructive hover:bg-muted"
							>
								<span className="grid size-9 place-items-center rounded-lg bg-secondary">
									<LogOut className="size-5" />
								</span>
								Sign out
							</button>
						</form>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}

function BarTab({ item, pathname }: { item: NavItem; pathname: string }) {
	const Icon = item.icon;
	const on = isActive(pathname, item.href);
	return (
		<Link
			href={item.href}
			className={cn(
				"flex flex-1 flex-col items-center gap-1 py-2 text-[0.65rem] font-medium transition-colors",
				on ? "text-secondary" : "text-primary-foreground/55",
			)}
		>
			<Icon className="size-5" />
			{item.label}
		</Link>
	);
}
