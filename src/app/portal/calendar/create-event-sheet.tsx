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
import { createEventAction } from "./actions";

const FIELD = "w-full rounded-lg border border-border bg-background p-2 text-sm";

// datetime-local yields "YYYY-MM-DDTHH:mm" in local time; z.coerce.date() parses it.
function defaultStart(): string {
	const d = new Date();
	d.setMinutes(0, 0, 0);
	d.setHours(d.getHours() + 1);
	return toLocalInput(d);
}
function toLocalInput(d: Date): string {
	const off = d.getTimezoneOffset() * 60000;
	return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export function CreateEventSheet() {
	const router = useRouter();
	// The mobile "+" quick action links to /portal/calendar?create=1 to open this directly.
	const openFromUrl = useSearchParams().get("create") === "1";
	const [open, setOpen] = useState(openFromUrl);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const [title, setTitle] = useState("");
	const [type, setType] = useState<"official" | "casual" | "birthday">("casual");
	const [place, setPlace] = useState("");
	const [description, setDescription] = useState("");
	const [startsAt, setStartsAt] = useState(defaultStart);
	const [endsAt, setEndsAt] = useState("");
	const [capacity, setCapacity] = useState("");

	const endBeforeStart = Boolean(startsAt && endsAt && new Date(endsAt) <= new Date(startsAt));

	function reset() {
		setTitle("");
		setType("casual");
		setPlace("");
		setDescription("");
		setStartsAt(defaultStart());
		setEndsAt("");
		setCapacity("");
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
					startsAt,
					endsAt,
					capacity: capacity ? Number(capacity) : null,
				});
				setOpen(false);
				reset();
				router.push(`/portal/calendar/${id}`);
			} catch (e) {
				setError(e instanceof Error ? e.message : "Could not create the event.");
			}
		});
	}

	const canSubmit = title.trim() && place.trim() && description.trim() && startsAt && endsAt && !endBeforeStart;

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
				<Button size="sm">
					<CalendarPlus className="size-4" />
					Create event
				</Button>
			</SheetTrigger>
			<SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
				<SheetHeader>
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
						<select className={FIELD} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
							<option value="casual">Casual</option>
							<option value="official">Official</option>
							<option value="birthday">Birthday</option>
						</select>
					</label>

					<label className="grid gap-1.5 text-sm">
						<span className="font-medium">Place</span>
						<input
							className={FIELD}
							value={place}
							onChange={(e) => setPlace(e.target.value)}
							placeholder="CS Lab 2 / Discord"
						/>
					</label>

					<div className="grid grid-cols-2 gap-3">
						<label className="grid gap-1.5 text-sm">
							<span className="font-medium">Starts</span>
							<input
								type="datetime-local"
								className={FIELD}
								value={startsAt}
								onChange={(e) => setStartsAt(e.target.value)}
							/>
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

					{error ? <p className="text-sm text-destructive">{error}</p> : null}
				</div>

				<SheetFooter className="flex-row justify-end gap-2">
					<Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
						Cancel
					</Button>
					<Button type="button" onClick={submit} disabled={pending || !canSubmit}>
						{pending ? "Creating…" : "Create event"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
