import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireActor } from "@/server/auth/actor";
import { signOutAction } from "./actions";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
	const actor = await requireActor();
	const isAdmin = actor.roles.includes("super");

	return (
		<main className="min-h-screen bg-background text-foreground">
			<header className="border-b bg-primary text-primary-foreground">
				<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<Link href="/portal/links" className="flex items-center gap-3">
						<Image src="/code-logo-full-white.png" alt="CODE" width={112} height={40} priority className="h-9 w-auto object-contain" />
						<span className="hidden text-sm text-white/70 sm:inline">Member portal</span>
					</Link>
					<div className="flex items-center gap-2">
						{isAdmin ? <span className="rounded-md bg-white/10 px-2 py-1 text-xs font-semibold text-white/80">Admin</span> : null}
						<form action={signOutAction}>
							<Button className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white" variant="outline" size="sm">
								<LogOut />
								Sign out
							</Button>
						</form>
					</div>
				</div>
			</header>
			<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
		</main>
	);
}
