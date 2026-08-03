import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberCodeCard } from "@/components/member-code-card";
import { getRepositories } from "@/db";
import type { EventPointAwardRow } from "@/db/repositories/events";
import { allowedEventTypes } from "@/db/repositories/eventTypeRules";
import { formatUtc8DateTime } from "@/lib/date-slots";
import { loadEventTypes } from "@/lib/event-type-load";
import { answerLabel, type EventSignupAnswers, type EventSignupField } from "@/lib/event-signup-form";
import { requireActor } from "@/server/auth/actor";
import { buildAwardEditorRows } from "./award-editor-input";
import { EventManagePanel, type SignupResponseRow } from "./event-manage-panel";
import { EventSignupPanel } from "./event-signup-panel";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
	const [actor, { eventId }, repositories] = await Promise.all([requireActor(), params, getRepositories()]);
	const [event, managed, awardLoad, typeLoad] = await Promise.all([
		repositories.calendar.getEvent(actor, eventId).catch(() => null),
		repositories.events.getById(actor, eventId).catch(() => null),
		repositories.events
			.listAwards(actor, eventId)
			.then((rows) => ({ ok: true as const, rows }))
			.catch(() => ({ ok: false as const })),
		loadEventTypes(() => repositories.eventTypeRules.list()),
	]);
	if (!event) notFound();

	// Management view keys off the viewer-scoped capability flags on the event record.
	const isStaff = managed ? managed.myRole !== null || managed.canModerate : false;
	const canManageSignupResponses = managed
		? managed.myRole === "owner" || managed.myRole === "admin" || managed.canModerate
		: false;
	const canViewSignupResponses = event.rsvpResponsesPublic || canManageSignupResponses;
	const [pointTypeLoad, staff, attendance, invites, signups, terms] = await Promise.all([
		managed?.canSetPoints
			? repositories.pointTypes
					.list()
					.then((rows) => ({ ok: true as const, rows }))
					.catch(() => ({ ok: false as const }))
			: Promise.resolve({ ok: true as const, rows: [] }),
		managed && isStaff ? repositories.events.listStaff(actor, eventId).catch(() => []) : Promise.resolve([]),
		managed && isStaff ? repositories.events.listAttendance(actor, eventId).catch(() => []) : Promise.resolve([]),
		managed && isStaff ? repositories.events.listInvites(actor, eventId).catch(() => []) : Promise.resolve([]),
		canViewSignupResponses ? repositories.events.listSignupResponses(actor, eventId).catch(() => []) : Promise.resolve([]),
		managed && isStaff ? repositories.retention.listTerms(actor).catch(() => []) : Promise.resolve([]),
	]);
	const awardsUnavailable = !awardLoad.ok || !pointTypeLoad.ok;
	const awardRows =
		managed?.canSetPoints && awardLoad.ok && pointTypeLoad.ok
			? buildAwardEditorRows(pointTypeLoad.rows, awardLoad.rows)
			: [];
	const rows = typeLoad.ok ? typeLoad.rows : [];
	const allowedTypesForActor = typeLoad.ok ? allowedEventTypes(actor, rows) : [];
	// The event's current type must always render as an option, even when the actor's
	// permissions would no longer let them create it. Leaving it unchanged is always legal,
	// and dropping it from the list would make an unrelated save silently change the type.
	const allowedTypesForEdit = managed
		? allowedTypesForActor.some((row) => row.type === managed.type)
			? allowedTypesForActor
			: [...allowedTypesForActor, ...rows.filter((row) => row.type === managed.type)]
		: [];
	// Points attach to a term; resolve the active one server-side, same as markPresentAction.
	const currentTerm = terms.find((t) => t.isCurrent);

	return (
		<div className="grid gap-5">
			<Link
				href="/portal/calendar"
				className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Back to calendar
			</Link>

			<div className="grid min-w-0 gap-5 lg:grid-cols-[1fr_320px]">
				<Card className="min-w-0 self-start">
					<CardHeader>
						<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
							<CardTitle className="min-w-0 break-words text-2xl">{event.title}</CardTitle>
							<Badge variant={event.iAttended ? "default" : "secondary"}>
								{event.iAttended ? "Attended" : event.myRsvp === "going" ? "Going" : "Not going"}
							</Badge>
						</div>
						<CardDescription>
							{event.place} · {formatUtc8DateTime(event.startsAt)} UTC+8
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-5 text-sm">
						<p className="leading-relaxed">{event.description}</p>
						<div className="grid gap-2">
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Worth</p>
							{awardLoad.ok ? <AwardChips awards={awardLoad.rows} /> : <p className="text-muted-foreground">Unavailable</p>}
						</div>
						<SignupResponses
							count={event.attendingCount}
							form={event.rsvpForm}
							signups={signups}
							canViewResponses={canViewSignupResponses}
							responsesPublic={event.rsvpResponsesPublic}
						/>
					</CardContent>
				</Card>

				<div className="grid gap-5">
					<EventSignupPanel
						eventId={event.id}
						form={event.rsvpForm}
						initialState={event.myRsvp}
						initialAnswers={event.myRsvpAnswers}
					/>
					{event.iAttended ? (
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Check in</CardTitle>
							<CardDescription>You are marked present for this event.</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex flex-col items-center gap-2 py-4 text-center">
								<CheckCircle2 className="size-10 text-accent" />
								<p className="text-sm font-medium">Checked in</p>
							</div>
						</CardContent>
					</Card>
					) : (
					<MemberCodeCard
						memberId={actor.memberId}
						title="Check in"
						description="Show this code to an organizer to be marked present."
					/>
					)}
				</div>
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
						graceMinutes: managed.graceMinutes,
						rsvpForm: managed.rsvpFormJson,
						rsvpResponsesPublic: managed.rsvpResponsesPublic,
						myRole: managed.myRole,
						canModerate: managed.canModerate,
						canSetPoints: managed.canSetPoints,
					}}
					staff={staff}
					attendance={attendance}
					invites={invites}
					signups={signups}
					termId={currentTerm?.id ?? null}
					allowedEventTypes={allowedTypesForEdit}
					typeRows={rows}
					typesUnavailable={!typeLoad.ok}
					awardRows={awardRows}
					awardsUnavailable={awardsUnavailable}
				/>
			) : null}
		</div>
	);
}

function AwardChips({ awards }: { awards: EventPointAwardRow[] }) {
	const activeAwards = awards.filter((award) => award.pointTypeActive);
	if (activeAwards.length === 0) {
		return <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">No points</Badge>;
	}

	return (
		<ul className="flex flex-wrap gap-2">
			{activeAwards.map((award) => (
				<li
					key={award.pointTypeId}
					className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
				>
					<span className="tabular-nums text-accent">
						{award.points} {Math.abs(award.points) === 1 ? "pt" : "pts"}
					</span>
					<span>{award.pointTypeLabel}</span>
				</li>
			))}
		</ul>
	);
}

function SignupResponses({
	count,
	form,
	signups,
	canViewResponses,
	responsesPublic,
}: {
	count: number;
	form: EventSignupField[];
	signups: SignupResponseRow[];
	canViewResponses: boolean;
	responsesPublic: boolean;
}) {
	return (
		<section className="grid gap-3 border-t border-border pt-4">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<span className="grid size-8 place-items-center rounded-lg bg-secondary text-accent">
						<Users className="size-4" />
					</span>
					<div>
						<p className="font-semibold">Going</p>
						<p className="text-xs text-muted-foreground">{count} signed up</p>
					</div>
				</div>
				<Badge variant="secondary" className="rounded-full px-3 py-1">{count}</Badge>
			</div>

			{canViewResponses ? (
				signups.length > 0 ? (
					<ul className="divide-y divide-border rounded-lg border border-border">
						{signups.map((row) => (
							<li key={row.memberId} className="grid gap-2 px-3 py-3">
								<div className="flex items-center justify-between gap-3">
									<p className="truncate font-medium">{displayName(row)}</p>
									<Badge variant={row.scannedAt ? "success" : "secondary"} className="shrink-0 text-[10px]">
										{row.scannedAt ? "Present" : "Going"}
									</Badge>
								</div>
								<AnswerList form={form} answers={row.answers} />
							</li>
						))}
					</ul>
				) : (
					<p className="text-sm text-muted-foreground">No one has signed up yet.</p>
				)
			) : null}
			{canViewResponses && !responsesPublic ? (
				<p className="text-xs text-muted-foreground">Responses are private to organizers.</p>
			) : null}
		</section>
	);
}

function AnswerList({ form, answers }: { form: EventSignupField[]; answers: EventSignupAnswers }) {
	const entries = Object.entries(answers);
	if (entries.length === 0) return <p className="text-xs text-muted-foreground">No form answers.</p>;

	return (
		<dl className="grid gap-1.5 text-xs">
			{entries.map(([fieldId, value]) => (
				<div key={fieldId} className="grid gap-1 rounded-md bg-secondary/40 px-2.5 py-2 sm:grid-cols-[minmax(8rem,12rem)_1fr]">
					<dt className="font-medium text-muted-foreground">{answerLabel(form, fieldId)}</dt>
					<dd className="min-w-0 break-words text-foreground">{value}</dd>
				</div>
			))}
		</dl>
	);
}

function displayName(m: { fullName?: string | null; name?: string | null }): string {
	return m.fullName ?? m.name ?? "Member";
}
