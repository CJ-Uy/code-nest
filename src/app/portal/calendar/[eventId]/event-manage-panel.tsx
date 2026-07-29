"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeftRight,
	Check,
	Coins,
	Crown,
	Pencil,
	ScanLine,
	Search,
	Shield,
	Trash2,
	UserPlus,
	Users,
	X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateTimePicker } from "@/components/date-time-picker";
import { EventScanOverlay } from "@/components/event-scan-overlay";
import type { EventTypeRow } from "@/db/repositories/eventTypeRules";
import { fromLocalInput, toLocalInput } from "@/lib/date-slots";
import { cn } from "@/lib/utils";
import {
	addStaffAction,
	deleteEventAction,
	inviteAction,
	markPresentAction,
	removeStaffAction,
	searchMembersAction,
	transferOwnershipAction,
	updateEventAction,
} from "./actions";
import type { AwardEditorRow } from "./award-editor-input";
import { EventAwardsEditor } from "./event-awards-editor";

const FIELD = "w-full rounded-lg border border-border bg-background p-2 text-sm";
const CHECKIN_LEAD_MS = 30 * 60 * 1000;
// Matches the message markPresentAction() throws when no term is current, so the
// camera path and the search path never disagree about why scanning can't proceed.
const NO_ACTIVE_TERM_MESSAGE = "No active school year to record attendance against.";

export type StaffMember = {
	memberId: string;
	fullName: string | null;
	name: string | null;
	role: "owner" | "admin" | "scanner";
};
export type AttendanceRow = { memberId: string; fullName: string | null; name: string | null; scannedAt: Date };
export type InviteRow = { memberId: string; fullName: string | null; invitedAt: Date };

export type ManageEvent = {
	id: string;
	title: string;
	type: string;
	place: string;
	description: string;
	startsAt: Date;
	endsAt: Date | null;
	capacity: number | null;
	graceMinutes: number | null;
	myRole: "owner" | "admin" | "scanner" | null;
	canModerate: boolean;
	canSetPoints: boolean;
};

type Section = "checkins" | "people" | "details" | "points";

function displayName(m: { fullName?: string | null; name?: string | null }): string {
	return m.fullName ?? m.name ?? "Member";
}

export function EventManagePanel({
	event,
	staff,
	attendance,
	invites,
	termId,
	allowedEventTypes,
	typeRows,
	typesUnavailable,
	awardRows,
	awardsUnavailable,
}: {
	event: ManageEvent;
	staff: StaffMember[];
	attendance: AttendanceRow[];
	invites: InviteRow[];
	termId: string | null;
	allowedEventTypes: EventTypeRow[];
	typeRows: EventTypeRow[];
	typesUnavailable: boolean;
	awardRows: AwardEditorRow[];
	awardsUnavailable: boolean;
}) {
	const isOwner = event.myRole === "owner";
	const canManage = isOwner || event.myRole === "admin" || event.canModerate;
	const canScan = event.myRole !== null || event.canModerate;
	const canOverrideWindow = isOwner || event.myRole === "admin" || event.canModerate;

	const allTabs: { id: Section; label: string; icon: typeof Users; show: boolean }[] = [
		{ id: "checkins", label: "Check-ins", icon: ScanLine, show: canScan },
		{ id: "people", label: "People", icon: Users, show: canManage },
		{ id: "details", label: "Details", icon: Pencil, show: canManage },
		{ id: "points", label: "Points", icon: Coins, show: event.canSetPoints },
	];
	const tabs = allTabs.filter((t) => t.show);

	const [section, setSection] = useState<Section>(tabs[0]?.id ?? "checkins");
	if (tabs.length === 0) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Manage event</CardTitle>
				<CardDescription>You have {event.myRole ?? (event.canModerate ? "moderator" : "")} access here.</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-4">
				<div className="flex flex-wrap gap-1 rounded-lg border border-border p-0.5">
					{tabs.map((tab) => {
						const Icon = tab.icon;
						const active = section === tab.id;
						return (
							<button
								key={tab.id}
								type="button"
								onClick={() => setSection(tab.id)}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
									active ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
								)}
							>
								<Icon className="size-4" />
								{tab.label}
							</button>
						);
					})}
				</div>

				{section === "checkins" ? (
					<CheckinsSection
						event={event}
						attendance={attendance}
						canOverrideWindow={canOverrideWindow}
						termId={termId}
					/>
				) : null}
				{section === "people" ? <PeopleSection event={event} staff={staff} invites={invites} isOwner={isOwner} /> : null}
				{section === "details" ? (
					<DetailsSection
						event={event}
						allowedEventTypes={allowedEventTypes}
						typeRows={typeRows}
						typesUnavailable={typesUnavailable}
					/>
				) : null}
				{section === "points" ? (
					<EventAwardsEditor eventId={event.id} rows={awardRows} unavailable={awardsUnavailable} />
				) : null}
			</CardContent>
		</Card>
	);
}

/* ---------- Member picker (shared by scanner + invites + staff) ---------- */

type FoundMember = { memberId: string; fullName: string | null; name: string | null; alreadyScanned: boolean };

function MemberPicker({
	eventId,
	placeholder,
	onPick,
	renderMeta,
}: {
	eventId: string;
	placeholder: string;
	onPick: (m: FoundMember) => void;
	renderMeta?: (m: FoundMember) => React.ReactNode;
}) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<FoundMember[]>([]);
	const [pending, startTransition] = useTransition();

	function run(q: string) {
		setQuery(q);
		if (q.trim().length < 2) {
			setResults([]);
			return;
		}
		startTransition(async () => {
			try {
				setResults(await searchMembersAction(eventId, q));
			} catch {
				setResults([]);
			}
		});
	}

	return (
		<div className="grid gap-2">
			<div className="relative">
				<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<input className={cn(FIELD, "pl-8")} value={query} placeholder={placeholder} onChange={(e) => run(e.target.value)} />
			</div>
			{query.trim().length >= 2 ? (
				<div className="max-h-60 overflow-y-auto rounded-lg border border-border">
					{pending && results.length === 0 ? (
						<p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
					) : results.length === 0 ? (
						<p className="px-3 py-2 text-sm text-muted-foreground">No members found.</p>
					) : (
						results.map((m) => (
							<button
								key={m.memberId}
								type="button"
								onClick={() => onPick(m)}
								className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-secondary/50"
							>
								<span className="truncate">{displayName(m)}</span>
								{renderMeta?.(m)}
							</button>
						))
					)}
				</div>
			) : null}
		</div>
	);
}

/* ---------- Check-ins ---------- */

function CheckinsSection({
	event,
	attendance,
	canOverrideWindow,
	termId,
}: {
	event: ManageEvent;
	attendance: AttendanceRow[];
	canOverrideWindow: boolean;
	termId: string | null;
}) {
	const router = useRouter();
	const [flash, setFlash] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [overlayOpen, setOverlayOpen] = useState(false);
	const [, startTransition] = useTransition();

	// ponytail: snapshot "now" at mount. This banner is advisory; recordScan enforces the
	// window server-side. A member who lingers past the boundary just refreshes.
	const [now] = useState(() => Date.now());
	const opensAt = event.startsAt.getTime() - CHECKIN_LEAD_MS;
	const closesAt = event.endsAt?.getTime() ?? event.startsAt.getTime();
	const windowOpen = now >= opensAt && now <= closesAt;

	function markById(memberId: string, label?: string) {
		setError(null);
		setFlash(null);
		startTransition(async () => {
			try {
				const res = await markPresentAction(event.id, memberId);
				const who = label ?? "Member";
				setFlash(res.alreadyPresent ? `${who} was already checked in.` : `Checked in ${who}.`);
				router.refresh();
			} catch (e) {
				setError(e instanceof Error ? e.message : "Could not mark present.");
			}
		});
	}

	function mark(m: FoundMember) {
		markById(m.memberId, displayName(m));
	}

	return (
		<div className="grid gap-3">
			<div
				className={cn(
					"rounded-lg border px-3 py-2 text-sm",
					windowOpen
						? "border-accent/40 bg-accent/10 text-foreground"
						: "border-border bg-secondary/40 text-muted-foreground",
				)}
			>
				{windowOpen
					? "Check-in is open. Scan a member's code or search by name to mark them present."
					: canOverrideWindow
						? "Check-in is closed, but your role can mark members present anytime."
						: "Check-in opens 30 minutes before the start and closes when the event ends."}
			</div>

			{windowOpen || canOverrideWindow ? (
				<div className="grid gap-3">
					{termId ? (
						<Button type="button" onClick={() => setOverlayOpen(true)}>
							<ScanLine className="size-4" />
							Scan attendance
						</Button>
					) : (
						<p className="rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
							{NO_ACTIVE_TERM_MESSAGE}
						</p>
					)}
					{overlayOpen && termId ? (
						<EventScanOverlay
							eventId={event.id}
							termId={termId}
							canUndo={canOverrideWindow}
							onClose={() => {
								setOverlayOpen(false);
								router.refresh();
							}}
						/>
					) : null}
					<div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
						<span className="h-px flex-1 bg-border" /> or search <span className="h-px flex-1 bg-border" />
					</div>
					<MemberPicker
						eventId={event.id}
						placeholder="Search a member to check in…"
						onPick={mark}
						renderMeta={(m) =>
							m.alreadyScanned ? (
								<Badge variant="secondary" className="text-[10px]">
									Present
								</Badge>
							) : (
								<span className="text-xs text-accent">Mark present</span>
							)
						}
					/>
				</div>
			) : null}

			{flash ? <p className="text-sm text-accent">{flash}</p> : null}
			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<div className="grid gap-1">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Present · {attendance.length}
				</p>
				{attendance.length === 0 ? (
					<p className="text-sm text-muted-foreground">No one checked in yet.</p>
				) : (
					<ul className="divide-y divide-border rounded-lg border border-border">
						{attendance.map((a) => (
							<li key={a.memberId} className="flex items-center justify-between px-3 py-2 text-sm">
								<span className="truncate">{displayName(a)}</span>
								<span className="text-xs text-muted-foreground">
									{a.scannedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
								</span>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

/* ---------- People ---------- */

const ROLE_ICON = { owner: Crown, admin: Shield, scanner: ScanLine } as const;
const ROLE_LABEL = { owner: "Owner", admin: "Admin", scanner: "Scanner" } as const;

function PeopleSection({
	event,
	staff,
	invites,
	isOwner,
}: {
	event: ManageEvent;
	staff: StaffMember[];
	invites: InviteRow[];
	isOwner: boolean;
}) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [addRole, setAddRole] = useState<"admin" | "scanner">("scanner");
	const [invited, setInvited] = useState<string | null>(null);
	const [, startTransition] = useTransition();

	function act(fn: () => Promise<unknown>, onOk?: () => void) {
		setError(null);
		startTransition(async () => {
			try {
				await fn();
				onOk?.();
				router.refresh();
			} catch (e) {
				setError(e instanceof Error ? e.message : "Something went wrong.");
			}
		});
	}

	const staffIds = new Set(staff.map((s) => s.memberId));

	return (
		<div className="grid gap-5">
			{/* Staff roster */}
			<div className="grid gap-2">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Team</p>
				<ul className="divide-y divide-border rounded-lg border border-border">
					{staff.map((s) => {
						const Icon = ROLE_ICON[s.role];
						return (
							<li key={s.memberId} className="flex items-center gap-2 px-3 py-2 text-sm">
								<Icon className="size-4 text-muted-foreground" />
								<span className="flex-1 truncate">{displayName(s)}</span>
								<Badge variant="secondary" className="text-[10px]">
									{ROLE_LABEL[s.role]}
								</Badge>
								{s.role !== "owner" ? (
									<button
										type="button"
										aria-label={`Remove ${displayName(s)}`}
										className="text-muted-foreground hover:text-destructive"
										onClick={() => act(() => removeStaffAction(event.id, s.memberId))}
									>
										<X className="size-4" />
									</button>
								) : null}
							</li>
						);
					})}
					{staff.length === 0 ? <li className="px-3 py-2 text-sm text-muted-foreground">Just you so far.</li> : null}
				</ul>

				<div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
					<div className="flex items-center gap-2">
						<UserPlus className="size-4 text-accent" />
						<span className="text-sm font-medium">Add to the team</span>
						<select
							value={addRole}
							onChange={(e) => setAddRole(e.target.value as "admin" | "scanner")}
							className="ml-auto rounded-md border border-border bg-background px-2 py-1 text-xs"
						>
							<option value="scanner">as Scanner</option>
							<option value="admin">as Admin</option>
						</select>
					</div>
					<MemberPicker
						eventId={event.id}
						placeholder="Search a member to add…"
						onPick={(m) => act(() => addStaffAction(event.id, m.memberId, addRole))}
						renderMeta={(m) =>
							staffIds.has(m.memberId) ? <span className="text-[10px] text-muted-foreground">On team</span> : null
						}
					/>
				</div>
			</div>

			{/* Invites */}
			<div className="grid gap-2">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invited · {invites.length}</p>
				{invites.length > 0 ? (
					<ul className="flex flex-wrap gap-1.5">
						{invites.map((i) => (
							<Badge key={i.memberId} variant="outline" className="font-normal">
								{i.fullName ?? "Member"}
							</Badge>
						))}
					</ul>
				) : (
					<p className="text-sm text-muted-foreground">No invites sent. Inviting just notifies members. The event stays public.</p>
				)}
				<MemberPicker
					eventId={event.id}
					placeholder="Invite a member…"
					onPick={(m) => act(() => inviteAction(event.id, [m.memberId]), () => setInvited(displayName(m)))}
				/>
				{invited ? <p className="text-sm text-accent">Invited {invited}.</p> : null}
			</div>

			{/* Transfer ownership (owner only) */}
			{isOwner ? (
				<div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
					<div className="flex items-center gap-2">
						<ArrowLeftRight className="size-4 text-muted-foreground" />
						<span className="text-sm font-medium">Transfer ownership</span>
					</div>
					<p className="text-xs text-muted-foreground">
						The new owner takes over. You stay on as an admin. This cannot be undone by you.
					</p>
					<MemberPicker
						eventId={event.id}
						placeholder="Hand off to…"
						onPick={(m) => {
							if (window.confirm(`Make ${displayName(m)} the owner? You'll become an admin.`)) {
								act(() => transferOwnershipAction(event.id, m.memberId));
							}
						}}
					/>
				</div>
			) : null}

			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	);
}

/* ---------- Details (edit + delete) ---------- */

function DetailsSection({
	event,
	allowedEventTypes,
	typeRows,
	typesUnavailable,
}: {
	event: ManageEvent;
	allowedEventTypes: EventTypeRow[];
	typeRows: EventTypeRow[];
	typesUnavailable: boolean;
}) {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	const [title, setTitle] = useState(event.title);
	const [type, setType] = useState(event.type);
	const [place, setPlace] = useState(event.place);
	const [description, setDescription] = useState(event.description);
	const [startsAt, setStartsAt] = useState(toLocalInput(event.startsAt));
	const [endsAt, setEndsAt] = useState(event.endsAt ? toLocalInput(event.endsAt) : "");
	const [capacity, setCapacity] = useState(event.capacity?.toString() ?? "");
	const [graceMinutes, setGraceMinutes] = useState(event.graceMinutes?.toString() ?? "");

	const endBeforeStart = Boolean(startsAt && endsAt && new Date(endsAt) <= new Date(startsAt));
	// The event's own current type must always be selectable, even if it fell outside the
	// actor's allowed types after the rules changed - leaving it unchanged is always legal,
	// and dropping it from the options would make an unrelated save silently change the type.
	const currentType = typeRows.find((row) => row.type === event.type) ?? {
		type: event.type,
		label: event.type,
		colour: "slate",
		requiredPermission: null,
		active: false,
		position: 0,
	};
	const typeOptions = allowedEventTypes.some((row) => row.type === event.type)
		? allowedEventTypes
		: [...allowedEventTypes, currentType];

	function save() {
		setError(null);
		setSaved(false);
		startTransition(async () => {
			try {
				await updateEventAction({
					eventId: event.id,
					title,
					type: typesUnavailable ? event.type : type,
					place,
					description,
					startsAt: fromLocalInput(startsAt).toISOString(),
					endsAt: fromLocalInput(endsAt).toISOString(),
					capacity: capacity ? Number(capacity) : null,
					graceMinutes: graceMinutes === "" ? null : Number(graceMinutes),
				});
				setSaved(true);
				router.refresh();
			} catch (e) {
				setError(e instanceof Error ? e.message : "Could not save.");
			}
		});
	}

	function remove() {
		if (!window.confirm("Delete this event? Attendance and points already earned are kept.")) return;
		startTransition(async () => {
			try {
				await deleteEventAction(event.id);
				router.push("/portal/calendar");
			} catch (e) {
				setError(e instanceof Error ? e.message : "Could not delete.");
			}
		});
	}

	return (
		<div className="grid gap-4">
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Title</span>
				<input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} />
			</label>
			<div className="grid grid-cols-2 gap-3">
				<label className="grid gap-1.5 text-sm">
					<span className="font-medium">Type</span>
					<select className={FIELD} value={type} onChange={(e) => setType(e.target.value)} disabled={typesUnavailable}>
						{typeOptions.map((option) => (
							<option key={option.type} value={option.type}>
								{option.label}
							</option>
						))}
					</select>
					{typesUnavailable ? <p className="text-sm text-destructive">Event types are unavailable right now. Try again shortly.</p> : null}
				</label>
				<label className="grid gap-1.5 text-sm">
					<span className="font-medium">Capacity</span>
					<input
						type="number"
						min={1}
						className={FIELD}
						value={capacity}
						placeholder="No limit"
						onChange={(e) => setCapacity(e.target.value)}
					/>
				</label>
				<label className="grid gap-1.5 text-sm">
					<span className="font-medium">Grace period</span>
					<input
						type="number"
						min={0}
						max={240}
						className={FIELD}
						value={graceMinutes}
						placeholder="15"
						onChange={(e) => setGraceMinutes(e.target.value)}
					/>
				</label>
			</div>
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Place</span>
				<input className={FIELD} value={place} onChange={(e) => setPlace(e.target.value)} />
			</label>
			<DateTimePicker
				startsAt={startsAt}
				endsAt={endsAt}
				onChange={(next) => {
					setStartsAt(next.startsAt);
					setEndsAt(next.endsAt);
				}}
			/>
			{endBeforeStart ? <p className="-mt-2 text-xs text-destructive">End must be after the start.</p> : null}
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Description</span>
				<textarea className={FIELD} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
			</label>

			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<div className="flex items-center gap-3">
				<Button type="button" onClick={save} disabled={pending || endBeforeStart}>
					{pending ? "Saving…" : "Save changes"}
				</Button>
				{saved ? (
					<span className="inline-flex items-center gap-1 text-sm text-accent">
						<Check className="size-4" /> Saved
					</span>
				) : null}
			</div>

			<div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
				<div>
					<p className="text-sm font-medium">Delete event</p>
					<p className="text-xs text-muted-foreground">Removes it from the calendar. Earned points stay.</p>
				</div>
				<Button type="button" variant="outline" className="text-destructive" onClick={remove} disabled={pending}>
					<Trash2 className="size-4" />
					Delete
				</Button>
			</div>
		</div>
	);
}
