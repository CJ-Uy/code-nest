import { redirect } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { getRepositories } from "@/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/server/auth/actor";
import { markAllNotificationsReadAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
	const actor = await getActor();
	if (!actor) redirect("/signin");

	const repositories = await getRepositories();
	// notifications has no shared-dev internal proxy yet; degrade to an empty feed instead of crashing.
	const items = await repositories.notifications.listFeed(actor, { limit: 50 }).catch(() => []);

	return (
		<div className="grid gap-5">
			<div className="flex items-end justify-between gap-4">
				<div>
					<p className="text-xs font-semibold uppercase text-primary">Member workspace</p>
					<h1 className="font-heading text-3xl">Notifications</h1>
				</div>
				<form action={markAllNotificationsReadAction}>
					<Button type="submit" variant="outline" size="sm">
						<CheckCheck />
						Mark all read
					</Button>
				</form>
			</div>

			{items.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center gap-2 py-12 text-center">
						<Bell className="h-8 w-8 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">You are all caught up.</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-3">
					{items.map((item) => {
						const content = (
							<Card className={item.readAt === null ? "border-primary/40" : undefined}>
								<CardHeader>
									<div className="flex items-center justify-between gap-3">
										<CardTitle className="text-base">{item.title}</CardTitle>
										{item.readAt === null ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
									</div>
									<CardDescription>{item.body}</CardDescription>
								</CardHeader>
							</Card>
						);
						return item.href ? (
							<Link key={item.id} href={item.href}>
								{content}
							</Link>
						) : (
							<div key={item.id}>{content}</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
