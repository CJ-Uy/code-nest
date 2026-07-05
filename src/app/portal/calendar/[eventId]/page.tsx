import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventCheckinQr } from "@/components/event-checkin-qr";
import { getRepositories } from "@/db";
import { createCheckinToken } from "@/lib/checkin-token";
import { requireActor } from "@/server/auth/actor";
import { getAppConfig } from "@/server/env";
import { EventManagePanel } from "./event-manage-panel";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
	const actor = await requireActor();
	const { eventId } = await params;
	const repositories = await getRepositories();
	const event = await repositories.calendar.getEvent(actor, eventId).catch(() => null);
	if (!event) notFound();

	// Management view keys off the viewer-scoped capability flags on the event record.
	const managed = await repositories.events.getById(actor, eventId).catch(() => null);
	const isStaff = managed ? managed.myRole !== null || managed.canModerate : false;
	const [staff, attendance, invites] =
		managed && isStaff
			? await Promise.all([
					repositories.events.listStaff(actor, eventId).catch(() => []),
					repositories.events.listAttendance(actor, eventId).catch(() => []),
					repositories.events.listInvites(actor, eventId).catch(() => []),
				])
			: [[], [], []];

	const config = getAppConfig();
	// Tokens require AUTH_SECRET, which is intentionally absent in shared-dev; the
	// static profile member code stays the fallback there.
	const checkinToken =
		!event.iAttended && config.AUTH_SECRET
			? await createCheckinToken(config.AUTH_SECRET, { memberId: actor.memberId, eventId })
			: null;

	return (
		<div className="grid gap-5">
			<Link
				href="/portal/calendar"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Back to calendar
			</Link>

			<div className="grid gap-5 lg:grid-cols-[1fr_320px]">
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<CardTitle className="text-2xl">{event.title}</CardTitle>
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

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Check in</CardTitle>
						<CardDescription>
							{event.iAttended ? "You are marked present for this event." : "Show your code to an organizer."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{event.iAttended ? (
							<div className="flex flex-col items-center gap-2 py-4 text-center">
								<CheckCircle2 className="size-10 text-accent" />
								<p className="text-sm font-medium">Checked in</p>
							</div>
						) : checkinToken ? (
							<EventCheckinQr token={checkinToken} />
						) : (
							<p className="text-sm text-muted-foreground">
								Use the member code from your profile menu to check in at this event.
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{managed && isStaff ? (
				<EventManagePanel
					event={{
						id: managed.id,
						title: managed.title,
						type: managed.type,
						place: managed.place,
						description: managed.description,
						startsAt: managed.startsAt,
						endsAt: managed.endsAt,
						capacity: managed.capacity,
						points: managed.points,
						myRole: managed.myRole,
						canModerate: managed.canModerate,
						canSetPoints: managed.canSetPoints,
					}}
					staff={staff}
					attendance={attendance}
					invites={invites}
				/>
			) : null}
		</div>
	);
}
