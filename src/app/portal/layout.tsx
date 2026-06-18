import Link from "next/link";
import { redirect } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { getActor } from "@/server/auth/actor";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
	const actor = await getActor();
	if (!actor) redirect("/signin");

	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="border-b border-border bg-card text-card-foreground">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
					<Link className="font-heading text-2xl" href="/portal">
						CODE Portal
					</Link>
					<div className="flex items-center gap-2">
						<Button asChild size="sm" variant="ghost">
							<Link href="/portal/profile">
								<UserRound />
								Profile
							</Link>
						</Button>
						<form
							action={async () => {
								"use server";
								await signOut({ redirectTo: "/" });
							}}
						>
							<Button size="sm" type="submit" variant="outline">
								<LogOut />
								Sign out
							</Button>
						</form>
					</div>
				</div>
			</header>
			{children}
		</div>
	);
}
