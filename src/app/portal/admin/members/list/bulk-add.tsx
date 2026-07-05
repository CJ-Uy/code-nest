"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { parseEmailColumn } from "@/lib/roster-emails";
import { bulkAddRosterAction, type BulkAddResult } from "./actions";

export function BulkAdd({ termId }: { termId: string }) {
	const [raw, setRaw] = useState("");
	const [result, setResult] = useState<BulkAddResult | null>(null);
	const [pending, startTransition] = useTransition();

	const preview = parseEmailColumn(raw);
	const overCap = preview.valid.length > 500;

	function submit() {
		setResult(null);
		startTransition(async () => {
			try {
				const res = await bulkAddRosterAction({ termId, raw });
				setResult(res);
				setRaw("");
			} catch (error) {
				window.alert(error instanceof Error ? error.message : "Bulk add failed.");
			}
		});
	}

	return (
		<div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
			<label className="text-sm font-medium" htmlFor="bulk-emails">
				Bulk add — paste a column of emails (e.g. from Google Sheets)
			</label>
			<textarea
				id="bulk-emails"
				value={raw}
				onChange={(e) => setRaw(e.target.value)}
				rows={5}
				placeholder={"member1@example.com\nmember2@example.com"}
				className="w-full rounded-lg border border-border bg-background p-2 text-sm"
			/>
			<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
				<span>
					{preview.valid.length} valid · {preview.dedupedInput} duplicate · {preview.invalid.length} invalid
				</span>
				<Button type="button" size="sm" onClick={submit} disabled={pending || preview.valid.length === 0 || overCap}>
					Add {preview.valid.length} to roster
				</Button>
				{overCap ? <span className="text-destructive">Over the 500 limit — split into batches.</span> : null}
			</div>
			{preview.invalid.length > 0 ? (
				<details className="text-sm">
					<summary className="cursor-pointer text-muted-foreground">Show {preview.invalid.length} invalid line(s)</summary>
					<pre className="mt-1 overflow-x-auto rounded bg-secondary/40 p-2 text-xs">{preview.invalid.join("\n")}</pre>
				</details>
			) : null}
			{result ? (
				<p className="text-sm text-foreground">
					Added {result.added}. {result.alreadyMembers} already on the roster
					{result.invalid.length > 0 ? `, ${result.invalid.length} invalid skipped` : ""}.
				</p>
			) : null}
		</div>
	);
}
