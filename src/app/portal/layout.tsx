import Image from "next/image";
import Link from "next/link";
import { Link2, LogOut, ShieldCheck } from "lucide-react";
import { navPinIconFor } from "@/components/portal/nav-pin-icons";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { hasAnyAdminScope } from "@/server/auth/admin";
import { signOutAction } from "./actions";

function initialsFrom(value: string): string {
	const parts = value.trim().split(/\s+/).slice(0, 2);
	return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "M";
}

function isExternalHref(href: string): boolean {
	return /^https?:\/\//.test(href);
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
	const actor = await requireActor();
	const isAdmin = hasAnyAdminScope(actor);
	const { members, navPins } = await getRepositories();
	const member = await members.getById(actor, actor.memberId).catch(() => null);
	const pins = await navPins.listVisible(actor).catch(() => []);
	const displayName = member?.nickname ?? member?.fullName ?? member?.name ?? member?.email ?? "Member";
	const subtitle = member?.email ?? "Signed in";
	const initials = initialsFrom(displayName);

	return (
		<div className="min-h-screen bg-background text-foreground lg:flex">
			<aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-primary px-4 py-6 text-primary-foreground lg:flex">
				<Link href="/portal/links" aria-label="Ateneo CODE portal" className="mb-7 flex items-center gap-2.5 px-2">
					<Image src="/code-falcon-white.png" alt="" width={48} height={48} priority className="h-9 w-auto object-contain" />
					<span className="flex flex-col leading-none">
						<span className="text-[0.6rem] font-medium uppercase text-primary-foreground/70">Ateneo</span>
						<span className="font-heading text-xl font-bold leading-tight">CODE</span>
					</span>
				</Link>

				<nav className="flex flex-col gap-1" aria-label="Portal modules">
					<Link href="/portal/links" className="relative flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold text-primary-foreground">
						<span className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-secondary" aria-hidden />
						<Link2 className="size-5" />
						<span className="flex-1">Link shortener</span>
					</Link>
					{isAdmin ? (
						<Link href="/portal/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary-foreground/70 transition hover:bg-white/10 hover:text-primary-foreground">
							<ShieldCheck className="size-5" />
							<span className="flex-1">Admin</span>
						</Link>
					) : null}
					{pins.length > 0 ? (
						<div className="mt-4 border-t border-white/10 pt-4">
							<p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase text-primary-foreground/45">Pinned</p>
							<div className="flex flex-col gap-1">
								{pins.map((pin) => {
									const Icon = navPinIconFor(pin.icon);
									const className = "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary-foreground/70 transition hover:bg-white/10 hover:text-primary-foreground";
									const body = (
										<>
											<Icon className="size-5" />
											<span className="min-w-0 flex-1 truncate">{pin.label}</span>
										</>
									);
									return isExternalHref(pin.url) ? (
										<a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" className={className}>
											{body}
										</a>
									) : (
										<Link key={pin.id} href={pin.url} className={className}>
											{body}
										</Link>
									);
								})}
							</div>
						</div>
					) : null}
				</nav>

				<div className="mt-auto pt-3">
					<div className="h-px bg-white/10" />
					<div className="mt-3 flex items-center gap-2 rounded-xl p-2">
						<div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-sm font-bold text-primary">
							{initials}
						</div>
						<div className="min-w-0 flex-1 leading-tight">
							<p className="truncate text-sm font-semibold text-primary-foreground">{displayName}</p>
							<p className="truncate text-xs text-primary-foreground/60">{subtitle}</p>
						</div>
						<form action={signOutAction} className="shrink-0">
							<button
								type="submit"
								aria-label="Sign out"
								title="Sign out"
								className="grid size-8 place-items-center rounded-lg text-primary-foreground/60 transition-colors hover:bg-white/10 hover:text-primary-foreground"
							>
								<LogOut className="size-4" />
							</button>
						</form>
					</div>
				</div>
			</aside>

			<div className="flex min-h-screen w-full min-w-0 flex-col">
				<header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-primary px-4 py-3 text-primary-foreground sm:px-6 lg:border-b lg:border-border lg:bg-card lg:px-8 lg:text-card-foreground">
					<Link href="/portal/links" aria-label="Ateneo CODE portal" className="flex items-center gap-2 lg:hidden">
						<Image src="/code-falcon-white.png" alt="" width={42} height={42} priority className="h-8 w-auto object-contain" />
						<span className="flex flex-col leading-none">
							<span className="text-[0.55rem] font-medium uppercase text-primary-foreground/70">Ateneo</span>
							<span className="font-heading text-lg font-bold leading-tight">CODE</span>
						</span>
					</Link>
					<div className="hidden min-w-0 flex-1 lg:block">
						<p className="text-[0.65rem] font-semibold uppercase text-muted-foreground">Portal</p>
						<p className="truncate font-heading text-xl font-semibold text-foreground">Link shortener</p>
					</div>
					<div className="flex items-center gap-2">
						{isAdmin ? (
							<Link href="/portal/admin" className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-white/80 lg:bg-secondary lg:text-primary">
								Admin
							</Link>
						) : null}
						<form action={signOutAction} className="lg:hidden">
							<button
								type="submit"
								aria-label="Sign out"
								className="grid size-9 place-items-center rounded-lg text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground"
							>
								<LogOut className="size-4" />
							</button>
						</form>
					</div>
				</header>

				<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
			</div>

			<nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-primary text-primary-foreground lg:hidden" aria-label="Portal modules">
				<div className="mx-auto flex h-16 max-w-md items-center gap-4 overflow-x-auto px-4">
					<Link href="/portal/links" className="flex min-w-24 flex-col items-center gap-1 py-2 text-[0.7rem] font-semibold text-secondary">
						<Link2 className="size-5" />
						Link shortener
					</Link>
					{isAdmin ? (
						<Link href="/portal/admin" className="flex min-w-20 flex-col items-center gap-1 py-2 text-[0.7rem] font-semibold text-primary-foreground/70">
							<ShieldCheck className="size-5" />
							Admin
						</Link>
					) : null}
					{pins.map((pin) => {
						const Icon = navPinIconFor(pin.icon);
						const className = "flex min-w-20 flex-col items-center gap-1 py-2 text-[0.7rem] font-semibold text-primary-foreground/70";
						const body = (
							<>
								<Icon className="size-5" />
								<span className="max-w-20 truncate">{pin.label}</span>
							</>
						);
						return isExternalHref(pin.url) ? (
							<a key={pin.id} href={pin.url} target="_blank" rel="noreferrer" className={className}>
								{body}
							</a>
						) : (
							<Link key={pin.id} href={pin.url} className={className}>
								{body}
							</Link>
						);
					})}
				</div>
			</nav>
		</div>
	);
}
