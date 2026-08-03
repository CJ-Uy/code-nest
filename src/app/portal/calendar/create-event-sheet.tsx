"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { DateTimePicker } from "@/components/date-time-picker";
import { deriveEnd, fromLocalInput, toLocalInput } from "@/lib/date-slots";
import type { EventSignupField } from "@/lib/event-signup-form";
import type { EventTypeRow } from "@/db/repositories/eventTypeRules";
import { createEventAction } from "./actions";
import { EventSignupFormEditor } from "./event-signup-form-editor";

const FIELD = "w-full rounded-lg border border-border bg-background p-2 text-sm";

// datetime-local yields "YYYY-MM-DDTHH:mm" in local time; z.coerce.date() parses it.
function defaultStart(): string {
	const d = new Date(Date.now() + 60 * 60_000);
	d.setUTCMinutes(0, 0, 0);
	return toLocalInput(d);
}

export function CreateEventSheet({
	allowedTypes,
	typesUnavailable,
}: {
	allowedTypes: EventTypeRow[];
	typesUnavailable: boolean;
}) {
	const router = useRouter();
	// The mobile "+" quick action links to /portal/calendar?create=1 to open this directly.
	const openFromUrl = useSearchParams().get("create") === "1";
	const [open, setOpen] = useState(openFromUrl);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const [title, setTitle] = useState("");
	const [type, setType] = useState(allowedTypes[0]?.type ?? "");
	const [place, setPlace] = useState("");
	const [description, setDescription] = useState("");
	const [startsAt, setStartsAt] = useState(defaultStart);
	const [endsAt, setEndsAt] = useState(() => deriveEnd(defaultStart(), 60));
	const [capacity, setCapacity] = useState("");
	const [graceMinutes, setGraceMinutes] = useState("");
	const [rsvpForm, setRsvpForm] = useState<EventSignupField[]>([]);

	function reset() {
		setTitle("");
		setType(allowedTypes[0]?.type ?? "");
		setPlace("");
		setDescription("");
		setStartsAt(defaultStart());
		setEndsAt(deriveEnd(defaultStart(), 60));
		setCapacity("");
		setGraceMinutes("");
		setRsvpForm([]);
		setError(null);
	}

	function submit() {
		setError(null);
		startTransition(async () => {
			try {
				const { id } = await createEventAction({
					title,
					type,
					place,
					description,
					startsAt: fromLocalInput(startsAt).toISOString(),
					endsAt: fromLocalInput(endsAt).toISOString(),
					capacity: capacity ? Number(capacity) : null,
					graceMinutes: graceMinutes === "" ? null : Number(graceMinutes),
					rsvpForm,
				});
				setOpen(false);
				reset();
				router.push(`/portal/calendar/${id}`);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Could not create the event.");
			}
		});
	}

	const noAllowedTypes = allowedTypes.length === 0;
	const endBeforeStart = Boolean(startsAt && endsAt && fromLocalInput(endsAt) <= fromLocalInput(startsAt));
	const canSubmit =
		title.trim() && place.trim() && description.trim() && startsAt && endsAt && !endBeforeStart && !noAllowedTypes && !typesUnavailable;

	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				setOpen(next);
				if (!next) {
					reset();
					if (openFromUrl) router.replace("/portal/calendar");
				}
			}}
		>
			<SheetTrigger asChild>
				<Button size="sm" className="desktop-slide-in-from-right">
					<CalendarPlus className="size-4" />
					Create event
				</Button>
			</SheetTrigger>
			<SheetContent className="h-[100dvh] w-full max-w-none gap-0 overflow-y-auto overscroll-contain sm:h-full sm:max-w-md">
				<SheetHeader className="sticky top-0 z-10 border-b bg-background pr-12">
					<SheetTitle className="font-heading text-xl">Create event</SheetTitle>
					<SheetDescription>Anyone can host. Your event goes on the calendar right away.</SheetDescription>
				</SheetHeader>

				<div className="grid gap-4 px-4 pb-2">
					<label className="grid gap-1.5 text-sm">
						<span className="font-medium">Title</span>
						<input className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Study jam" />
					</label>

					<label className="grid gap-1.5 text-sm">
						<span className="font-medium">Type</span>
						{typesUnavailable ? (
							<p className="text-sm text-destructive">Event types are unavailable right now. Try again shortly.</p>
						) : noAllowedTypes ? (
							<p className="text-sm text-destructive">
								You do not have permission to create any event type.
							</p>
						) : (
							<select className={FIELD} value={type} onChange={(e) => setType(e.target.value)}>
								{allowedTypes.map((option) => (
									<option key={option.type} value={option.type}>
										{option.label}
									</option>
								))}
							</select>
						)}
					</label>

					<label className="grid gap-1.5 text-sm">
						<span className="font-medium">Place</span>
						<input
							className={FIELD}
							value={place}
							onChange={(e) => setPlace(e.target.value)}
							placeholder="Leong Hall"
						/>
					</label>

					<DateTimePicker
						startsAt={startsAt}
						endsAt={endsAt}
						onChange={(next) => {
							setStartsAt(next.startsAt);
							setEndsAt(next.endsAt);
						}}
					/>
					<p className="-mt-2 text-xs text-muted-foreground">Times are saved and shown in UTC+8.</p>
					{endBeforeStart ? <p className="-mt-2 text-xs text-destructive">End must be after the start.</p> : null}

					<EventSignupFormEditor value={rsvpForm} onChange={setRsvpForm} />

					<label className="grid gap-1.5 text-sm">
						<span className="font-medium">Description</span>
						<textarea
							className={FIELD}
							rows={4}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="What's happening, who it's for."
						/>
					</label>

					<label className="grid gap-1.5 text-sm">
						<span className="font-medium">
							Capacity <span className="font-normal text-muted-foreground">· optional</span>
						</span>
						<input
							type="number"
							min={1}
							className={FIELD}
							value={capacity}
							onChange={(e) => setCapacity(e.target.value)}
							placeholder="No limit"
						/>
					</label>

					<label className="grid gap-1.5 text-sm">
						<span className="font-medium">Grace period (minutes)</span>
						<input
							type="number"
							min={0}
							max={240}
							className={FIELD}
							value={graceMinutes}
							onChange={(e) => setGraceMinutes(e.target.value)}
							placeholder="15"
						/>
						<span className="text-xs text-muted-foreground">
							Members scanned after this many minutes are marked late. Blank uses 15.
						</span>
					</label>

					{error ? <p className="text-sm text-destructive">{error}</p> : null}
				</div>

				<SheetFooter className="sticky bottom-0 z-10 mt-0 flex-row gap-2 border-t bg-background pb-[max(1rem,env(safe-area-inset-bottom))]">
					<Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => setOpen(false)} disabled={pending}>
						Cancel
					</Button>
					<Button type="button" className="flex-1 sm:flex-none" onClick={submit} disabled={pending || !canSubmit}>
						{pending ? "Creating…" : "Create event"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
