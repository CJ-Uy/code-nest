"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { summarizeDashboard, summarizeEvents } from "./dashboard-summary";

export type DashboardEvent = {
	id: string;
	title: string;
	type: string;
	status: string;
	place: string;
	startsAt: string;
};

export type DashboardAttendance = {
	eventId: string;
	memberId: string;
	memberName: string | null;
	memberEmail: string;
	scannedAt: string;
};

export type DashboardRecord = {
	recordId: string;
	memberId: string;
	memberName: string | null;
	memberEmail: string;
	eventId: string | null;
	eventTitle: string | null;
	pointTypeLabel: string;
	points: number | null;
	reason: string;
	source: "event_attendance" | "manual";
	recordedAt: string;
};

const date = (value: string) =>
	new Date(value).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

const time = (value: string) =>
	new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
	return (
		<div className="rounded-xl border border-border bg-card px-4 py-3">
			<p className="text-xs font-semibold text-muted-foreground">{label}</p>
			<p className="mt-1 font-heading text-3xl tabular-nums text-primary">{value.toLocaleString()}</p>
			<p className="text-xs text-muted-foreground">{note}</p>
		</div>
	);
}

export function EventsPointsDashboard({
	events,
	attendance,
	records,
}: {
	events: DashboardEvent[];
	attendance: DashboardAttendance[];
	records: DashboardRecord[];
}) {
	const [eventQuery, setEventQuery] = useState("");
	const [recordQuery, setRecordQuery] = useState("");
	const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
	const summaries = useMemo(() => summarizeEvents(events, attendance, records), [events, attendance, records]);
	const totals = useMemo(() => summarizeDashboard(events, attendance, records), [events, attendance, records]);
	const filteredEvents = useMemo(() => {
		const needle = eventQuery.trim().toLowerCase();
		if (!needle) return summaries;
		return summaries.filter((event) =>
			`${event.title} ${event.place} ${event.type} ${event.status}`.toLowerCase().includes(needle),
		);
	}, [eventQuery, summaries]);
	const selectedEvent = events.find((event) => event.id === selectedEventId);
	const selectedAttendance = attendance.filter((row) => row.eventId === selectedEventId);
	const selectedRecords = records.filter((row) => row.eventId === selectedEventId);
	const filteredRecords = useMemo(() => {
		const needle = recordQuery.trim().toLowerCase();
		if (!needle) return records;
		return records.filter((row) =>
			`${row.memberName ?? ""} ${row.memberEmail} ${row.eventTitle ?? ""} ${row.pointTypeLabel} ${row.reason}`
				.toLowerCase()
				.includes(needle),
		);
	}, [recordQuery, records]);

	return (
		<div className="grid gap-6">
			<section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Term summary">
				<Metric label="Events" value={totals.eventCount} note="In this school year" />
				<Metric label="Check-ins" value={totals.attendanceCount} note="Recorded attendance scans" />
				<Metric label="Points issued" value={totals.pointsIssued} note="Includes deductions" />
				<Metric label="Manual records" value={totals.manualCount} note="Added by an admin" />
			</section>

			<section className="overflow-hidden rounded-xl border border-border bg-card">
				<div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4">
					<div>
						<h2 className="font-heading text-2xl">Events</h2>
						<p className="text-sm text-muted-foreground">Choose an event to review its attendance and issued points.</p>
					</div>
					<div className="relative w-full sm:w-80">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							aria-label="Search dashboard events"
							className="pl-9"
							placeholder="Search events"
							value={eventQuery}
							onChange={(event) => setEventQuery(event.target.value)}
						/>
					</div>
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Event</TableHead>
							<TableHead>Date</TableHead>
							<TableHead className="text-right">Attended</TableHead>
							<TableHead className="text-right">Points</TableHead>
							<TableHead className="text-right">Manual</TableHead>
							<TableHead className="text-right">Action</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredEvents.map((event) => (
							<TableRow key={event.id} className={selectedEventId === event.id ? "bg-secondary/50" : undefined}>
								<TableCell>
									<p className="font-medium">{event.title}</p>
									<p className="text-xs text-muted-foreground">
										{event.place} · {event.type}
									</p>
								</TableCell>
								<TableCell>
									<p className="whitespace-nowrap">{date(event.startsAt)}</p>
									<Badge variant="secondary" className="mt-1 capitalize">
										{event.status}
									</Badge>
								</TableCell>
								<TableCell className="text-right tabular-nums">{event.attendanceCount}</TableCell>
								<TableCell className="text-right tabular-nums">{event.pointsIssued}</TableCell>
								<TableCell className="text-right tabular-nums">{event.manualCount}</TableCell>
								<TableCell>
									<div className="flex justify-end gap-2">
										<Button
											type="button"
											size="sm"
											variant={selectedEventId === event.id ? "secondary" : "outline"}
											onClick={() => setSelectedEventId(event.id)}
										>
											<Eye className="size-4" />
											View
										</Button>
										<Button asChild size="icon" variant="ghost" aria-label={`Manage ${event.title}`}>
											<Link href={`/portal/calendar/${event.id}`}>
												<ArrowRight className="size-4" />
											</Link>
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
						{filteredEvents.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
									No events match that search.
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
			</section>

			{selectedEvent ? (
				<section className="overflow-hidden rounded-xl border border-border bg-card">
					<div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4">
						<div>
							<p className="text-xs font-semibold text-primary">Attendance detail</p>
							<h2 className="font-heading text-2xl">{selectedEvent.title}</h2>
						</div>
						<Badge variant="secondary">
							<Users className="size-3.5" />
							{selectedAttendance.length} attended
						</Badge>
					</div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Member</TableHead>
								<TableHead>Checked in</TableHead>
								<TableHead>Points from this event</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{selectedAttendance.map((row) => {
								const memberRecords = selectedRecords.filter((record) => record.memberId === row.memberId);
								return (
									<TableRow key={row.memberId}>
										<TableCell>
											<p className="font-medium">{row.memberName ?? row.memberEmail}</p>
											<p className="text-xs text-muted-foreground">{row.memberEmail}</p>
										</TableCell>
										<TableCell className="whitespace-nowrap">
											{date(row.scannedAt)} at {time(row.scannedAt)}
										</TableCell>
										<TableCell>
											{memberRecords.length > 0 ? (
												<div className="flex flex-wrap gap-1.5">
													{memberRecords.map((record) => (
														<Badge key={record.recordId} variant="outline">
															{record.points ?? "No"} {record.pointTypeLabel}
														</Badge>
													))}
												</div>
											) : (
												<span className="text-sm text-muted-foreground">No points issued</span>
											)}
										</TableCell>
									</TableRow>
								);
							})}
							{selectedAttendance.length === 0 ? (
								<TableRow>
									<TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
										No one has checked in to this event.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
				</section>
			) : null}

			<section className="overflow-hidden rounded-xl border border-border bg-card">
				<div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4">
					<div>
						<h2 className="font-heading text-2xl">Points ledger</h2>
						<p className="text-sm text-muted-foreground">Every event-awarded and manual record in this school year.</p>
					</div>
					<div className="relative w-full sm:w-80">
						<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							aria-label="Search points ledger"
							className="pl-9"
							placeholder="Search member, event, or reason"
							value={recordQuery}
							onChange={(event) => setRecordQuery(event.target.value)}
						/>
					</div>
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Member</TableHead>
							<TableHead>Event or reason</TableHead>
							<TableHead>Type</TableHead>
							<TableHead className="text-right">Points</TableHead>
							<TableHead>Date</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredRecords.map((record) => (
							<TableRow key={record.recordId}>
								<TableCell>
									<p className="font-medium">{record.memberName ?? record.memberEmail}</p>
									<p className="text-xs text-muted-foreground">{record.memberEmail}</p>
								</TableCell>
								<TableCell>
									<p className="font-medium">{record.eventTitle ?? record.reason}</p>
									{record.eventTitle ? <p className="text-xs text-muted-foreground">{record.reason}</p> : null}
								</TableCell>
								<TableCell>
									<Badge variant={record.source === "manual" ? "outline" : "secondary"}>
										{record.source === "manual" ? "Manual" : "Event"}
									</Badge>
									<p className="mt-1 text-xs text-muted-foreground">{record.pointTypeLabel}</p>
								</TableCell>
								<TableCell className="text-right font-semibold tabular-nums">
									{record.points === null ? "None" : record.points}
								</TableCell>
								<TableCell className="whitespace-nowrap">{date(record.recordedAt)}</TableCell>
							</TableRow>
						))}
						{filteredRecords.length === 0 ? (
							<TableRow>
								<TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
									<CheckCircle2 className="mx-auto mb-2 size-5" />
									No point records match that search.
								</TableCell>
							</TableRow>
						) : null}
					</TableBody>
				</Table>
			</section>
		</div>
	);
}
