"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AwardEditorRow } from "./award-editor-input";
import { parseActiveAwardValues } from "./award-editor-input";
import { removeRetiredAwardAction, setAwardsAction } from "./actions";

export function EventAwardsEditor({
	eventId,
	rows,
	unavailable,
}: {
	eventId: string;
	rows: AwardEditorRow[];
	unavailable: boolean;
}) {
	const router = useRouter();
	const [values, setValues] = useState<Record<string, string>>(() =>
		Object.fromEntries(rows.filter((row) => !row.retired).map((row) => [row.pointTypeId, row.value])),
	);
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<string | null>(null);

	function save() {
		setError(null);
		startTransition(async () => {
			try {
				const result = await setAwardsAction(eventId, parseActiveAwardValues(rows, values));
				setResult(`Updated ${result.updated} attendee record(s).`);
				router.refresh();
			} catch (error) {
				setError(error instanceof Error ? error.message : "Could not update event awards.");
			}
		});
	}

	function removeRetired(pointTypeId: string) {
		setError(null);
		startTransition(async () => {
			try {
				await removeRetiredAwardAction(eventId, pointTypeId);
				router.refresh();
			} catch (error) {
				setError(error instanceof Error ? error.message : "Could not remove the retired award.");
			}
		});
	}

	if (unavailable) {
		return (
			<p className="rounded-lg border border-dashed border-border bg-secondary/40 px-3 py-2 text-sm text-destructive">
				Event awards are unavailable right now. Try again shortly.
			</p>
		);
	}

	return (
		<div className="grid min-w-0 gap-4">
			<p className="text-sm text-muted-foreground">
				Saving re-values every checked-in attendee. Leave a type empty when it should grant no points.
			</p>
			<div className="grid min-w-0 gap-3">
				{rows.map((row) =>
					row.retired ? (
						<div
							key={row.pointTypeId}
							className="flex min-w-0 flex-col gap-2 rounded-lg border border-border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
						>
							<div className="min-w-0 text-sm">
								<p className="break-all text-muted-foreground">
									<span className="font-medium text-foreground">{row.label}</span>
									{" - retired, no longer grants points"}
								</p>
								<p className="text-xs text-muted-foreground">Previously set to {row.value}.</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="self-start text-destructive sm:self-auto"
								onClick={() => removeRetired(row.pointTypeId)}
								disabled={pending}
							>
								<Trash2 />
								Remove
							</Button>
						</div>
					) : (
						<label
							key={row.pointTypeId}
							className="grid min-w-0 gap-1.5 text-sm sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center"
						>
							<span className="min-w-0 break-all font-medium">{row.label}</span>
							<Input
								type="number"
								min={-100}
								max={100}
								step={1}
								value={values[row.pointTypeId] ?? ""}
								placeholder="No points"
								onChange={(event) =>
									setValues((current) => ({ ...current, [row.pointTypeId]: event.target.value }))
								}
								disabled={pending}
							/>
						</label>
					),
				)}
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<Button type="button" onClick={save} disabled={pending}>
					<Save />
					{pending ? "Saving..." : "Save awards"}
				</Button>
				{result ? <p className="text-sm text-accent">{result}</p> : null}
			</div>
			{error ? <p className="text-sm text-destructive">{error}</p> : null}
		</div>
	);
}
