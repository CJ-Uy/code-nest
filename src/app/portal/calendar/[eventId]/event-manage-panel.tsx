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
import { cn } from "@/lib/utils";
import {
	addStaffAction,
	deleteEventAction,
	inviteAction,
	markPresentAction,
	removeStaffAction,
	searchMembersAction,
	setPointsAction,
	transferOwnershipAction,
	updateEventAction,
} from "./actions";

const FIELD = "w-full rounded-lg border border-border bg-background p-2 text-sm";
const CHECKIN_LEAD_MS = 30 * 60 * 1000;

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
	type: "official" | "casual" | "birthday";
	place: string;
	description: string;
	startsAt: Date;
	endsAt: Date | null;
	capacity: number | null;
	points: number | null;
	myRole: "owner" | "admin" | "scanner" | null;
	canModerate: boolean;
	canSetPoints: boolean;
};

type Section = "checkins" | "people" | "details" | "points";

function displayName(m: { fullName?: string | null; name?: string | null }): string {
	return m.fullName ?? m.name ?? "Member";
}
function toLocalInput(d: Date): string {
	const off = d.getTimezoneOffset() * 60000;
	return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function EventManagePanel({
	event,
	staff,
	attendance,
	invites,
}: {
	event: ManageEvent;
	staff: StaffMember[];
	attendance: AttendanceRow[];
	invites: InviteRow[];
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
					<CheckinsSection event={event} attendance={attendance} canOverrideWindow={canOverrideWindow} />
				) : null}
				{section === "people" ? <PeopleSection event={event} staff={staff} invites={invites} isOwner={isOwner} /> : null}
				{section === "details" ? <DetailsSection event={event} /> : null}
				{section === "points" ? <PointsSection event={event} /> : null}
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
}: {
	event: ManageEvent;
	attendance: AttendanceRow[];
	canOverrideWindow: boolean;
}) {
	const router = useRouter();
	const [flash, setFlash] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [, startTransition] = useTransition();

	// ponytail: snapshot "now" at mount — this banner is advisory; recordScan enforces the
	// window server-side. A member who lingers past the boundary just refreshes.
	const [now] = useState(() => Date.now());
	const opensAt = event.startsAt.getTime() - CHECKIN_LEAD_MS;
	const closesAt = event.endsAt?.getTime() ?? event.startsAt.getTime();
	const windowOpen = now >= opensAt && now <= closesAt;

	function mark(m: FoundMember) {
		setError(null);
		setFlash(null);
		startTransition(async () => {
			try {
				const res = await markPresentAction(event.id, m.memberId);
				setFlash(res.alreadyPresent ? `${displayName(m)} was already checked in.` : `Checked in ${displayName(m)}.`);
				router.refresh();
			} catch (e) {
				setError(e instanceof Error ? e.message : "Could not mark present.");
			}
		});
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
					? "Check-in is open. Search a member to mark them present."
					: canOverrideWindow
						? "Check-in is closed, but your role can mark members present anytime."
						: "Check-in opens 30 minutes before the start and closes when the event ends."}
			</div>

			{windowOpen || canOverrideWindow ? (
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
					<p className="text-sm text-muted-foreground">No invites sent. Inviting just notifies members — the event stays public.</p>
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

function DetailsSection({ event }: { event: ManageEvent }) {
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

	const endBeforeStart = Boolean(startsAt && endsAt && new Date(endsAt) <= new Date(startsAt));

	function save() {
		setError(null);
		setSaved(false);
		startTransition(async () => {
			try {
				await updateEventAction({
					eventId: event.id,
					title,
					type,
					place,
					description,
					startsAt,
					endsAt,
					capacity: capacity ? Number(capacity) : null,
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
					<select className={FIELD} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
						<option value="casual">Casual</option>
						<option value="official">Official</option>
						<option value="birthday">Birthday</option>
					</select>
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
			</div>
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Place</span>
				<input className={FIELD} value={place} onChange={(e) => setPlace(e.target.value)} />
			</label>
			<div className="grid grid-cols-2 gap-3">
				<label className="grid gap-1.5 text-sm">
					<span className="font-medium">Starts</span>
					<input type="datetime-local" className={FIELD} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
				</label>
				<label className="grid gap-1.5 text-sm">
					<span className="font-medium">Ends</span>
					<input
						type="datetime-local"
						className={FIELD}
						value={endsAt}
						min={startsAt || undefined}
						onChange={(e) => setEndsAt(e.target.value)}
					/>
				</label>
			</div>
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

/* ---------- Points (CRS admin only) ---------- */

function PointsSection({ event }: { event: ManageEvent }) {
	const router = useRouter();
	const [value, setValue] = useState(event.points?.toString() ?? "");
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<number | null>(null);

	function apply(points: number | null) {
		setError(null);
		setResult(null);
		startTransition(async () => {
			try {
				const res = await setPointsAction(event.id, points);
				setResult(res.updated);
				router.refresh();
			} catch (e) {
				setError(e instanceof Error ? e.message : "Could not set points.");
			}
		});
	}

	return (
		<div className="grid gap-3">
			<div className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
				Setting a value re-values <span className="font-medium text-foreground">everyone</span> who has checked in — before,
				during, or after. Leave it empty to keep attendance without points.
			</div>
			<div className="flex items-end gap-3">
				<label className="grid gap-1.5 text-sm">
					<span className="font-medium">Points per attendee</span>
					<input
						type="number"
						min={-100}
						max={100}
						className={cn(FIELD, "w-40")}
						value={value}
						placeholder="Unset"
						onChange={(e) => setValue(e.target.value)}
					/>
				</label>
				<Button type="button" onClick={() => apply(value === "" ? null : Number(value))} disabled={pending}>
					{pending ? "Applying…" : "Apply to all"}
				</Button>
				{event.points !== null ? (
					<Button type="button" variant="outline" onClick={() => apply(null)} disabled={pending}>
						Clear
					</Button>
				) : null}
			</div>
			{result !== null ? <p className="text-sm text-accent">Updated {result} attendee record(s).</p> : null}
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	);
}
