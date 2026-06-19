import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
	const actor = await requireActor();
	const { eventId } = await params;
	const repositories = await getRepositories();
	const event = await repositories.calendar.getEvent(actor, eventId).catch(() => null);
	if (!event) notFound();

	return (
		<main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-3">
						<CardTitle>{event.title}</CardTitle>
						<Badge variant={event.iAttended ? "default" : "secondary"}>
							{event.iAttended ? "Attended" : event.myRsvp === "going" ? "Going" : "Not going"}
						</Badge>
					</div>
					<CardDescription>
						{event.place} · {event.startsAt.toISOString().slice(0, 16).replace("T", " ")}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 text-sm">
					<p>{event.description}</p>
					<p className="text-muted-foreground">{event.attendingCount} attending</p>
				</CardContent>
			</Card>
		</main>
	);
}
