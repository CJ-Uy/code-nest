"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { primaryNav, sheetNav } from "./nav-items";

export type PortalShellProps = {
	member: { displayName: string; initials: string };
	navPins: { id: string; label: string; url: string }[];
	bell: React.ReactNode;
	children: React.ReactNode;
};

function isActive(pathname: string, href: string): boolean {
	return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}

export function PortalShell({ member, navPins, bell, children }: PortalShellProps) {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="sticky top-0 z-30 border-b border-border bg-card text-card-foreground">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
					<Link className="font-heading text-2xl" href="/portal">
						CODE Portal
					</Link>
					<div className="flex items-center gap-2">
						{bell}
						<span className="hidden text-sm text-muted-foreground sm:inline">{member.displayName}</span>
					</div>
				</div>
			</header>

			<div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-24 sm:px-6 lg:grid-cols-[230px_1fr] lg:px-8 lg:pb-6">
				<aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
					<nav className="grid gap-1" aria-label="Portal modules">
						{[...primaryNav, ...sheetNav].map((item) => {
							const Icon = item.icon;
							return (
								<Button
									key={item.id}
									asChild
									variant={isActive(pathname, item.href) ? "default" : "ghost"}
									className="justify-start"
								>
									<Link href={item.href}>
										<Icon />
										{item.label}
									</Link>
								</Button>
							);
						})}
					</nav>
					{navPins.length > 0 ? (
						<>
							<Separator className="my-4" />
							<nav className="grid gap-1" aria-label="Pinned links">
								{navPins.map((pin) => (
									<Button key={pin.id} asChild variant="ghost" className="justify-start">
										<Link href={pin.url}>{pin.label}</Link>
									</Button>
								))}
							</nav>
						</>
					) : null}
				</aside>

				<main className="min-w-0">{children}</main>
			</div>

			{/* Mobile bottom nav: fixed core slots + a center Menu button. */}
			<nav
				className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card lg:hidden"
				aria-label="Portal modules"
			>
				<div className="mx-auto grid max-w-md grid-cols-4 items-center">
					{primaryNav.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								key={item.id}
								href={item.href}
								className={cn(
									"flex flex-col items-center gap-1 py-2 text-xs",
									isActive(pathname, item.href) ? "text-primary" : "text-muted-foreground",
								)}
							>
								<Icon className="h-5 w-5" />
								{item.label}
							</Link>
						);
					})}
					<Sheet open={menuOpen} onOpenChange={setMenuOpen}>
						<SheetTrigger asChild>
							<button className="flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground" type="button">
								<Menu className="h-5 w-5" />
								Menu
							</button>
						</SheetTrigger>
						<SheetContent side="bottom">
							<SheetHeader>
								<SheetTitle>Menu</SheetTitle>
							</SheetHeader>
							<div className="grid gap-3 py-4">
								<div className="flex items-center gap-3 rounded-md border p-3">
									<QrCode className="h-10 w-10 text-foreground" />
									<div>
										<p className="text-sm font-medium">Your member code</p>
										<p className="text-xs text-muted-foreground">Show this to an event admin to record attendance.</p>
									</div>
								</div>
								{sheetNav.map((item) => {
									const Icon = item.icon;
									return (
										<Link
											key={item.id}
											href={item.href}
											className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium"
											onClick={() => setMenuOpen(false)}
										>
											<Icon className="h-4 w-4" />
											{item.label}
										</Link>
									);
								})}
								{navPins.map((pin) => (
									<Link
										key={pin.id}
										href={pin.url}
										className="rounded-md border p-3 text-sm font-medium"
										onClick={() => setMenuOpen(false)}
									>
										{pin.label}
									</Link>
								))}
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</nav>
		</div>
	);
}
