"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { parseEmailColumn } from "@/lib/roster-emails";
import { bulkAddMembersAction, inviteMemberAction, type BulkAddResult } from "./actions";

export function AddMembers() {
	const [bulk, setBulk] = useState(false);
	const [raw, setRaw] = useState("");
	const [result, setResult] = useState<BulkAddResult | null>(null);
	const [pending, startTransition] = useTransition();
	const preview = parseEmailColumn(raw);
	const overCap = preview.valid.length > 500;

	function submitBulk() {
		setResult(null);
		startTransition(async () => {
			try {
				const next = await bulkAddMembersAction({ raw });
				setResult(next);
				setRaw("");
			} catch (error) {
				window.alert(error instanceof Error ? error.message : "Bulk add failed.");
			}
		});
	}

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button type="button" size="sm">Add members</Button>
			</SheetTrigger>
			<SheetContent className="w-full overflow-y-auto sm:max-w-lg">
				<SheetHeader>
					<SheetTitle>Add members</SheetTitle>
					<SheetDescription>Invite one email or paste a bulk list.</SheetDescription>
				</SheetHeader>
				<div className="grid gap-3 px-4 pb-4">
					<div className="flex flex-wrap items-center gap-2">
						<Button type="button" size="sm" variant={!bulk ? "default" : "outline"} onClick={() => setBulk(false)}>
							Add one
						</Button>
						<Button type="button" size="sm" variant={bulk ? "default" : "outline"} onClick={() => setBulk(true)}>
							Add bulk
						</Button>
					</div>

					{bulk ? (
						<div className="grid gap-2 rounded-lg border border-dashed border-border p-3">
							<label className="text-sm font-medium" htmlFor="bulk-emails">
								Paste a column of emails
							</label>
							<Textarea
								id="bulk-emails"
								value={raw}
								onChange={(event) => setRaw(event.target.value)}
								rows={8}
								placeholder={"member1@example.com\nmember2@example.com"}
							/>
							<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
								<span>
									{preview.valid.length} valid, {preview.dedupedInput} duplicate, {preview.invalid.length} invalid
								</span>
								<Button type="button" size="sm" onClick={submitBulk} disabled={pending || preview.valid.length === 0 || overCap}>
									Add {preview.valid.length}
								</Button>
								{overCap ? <span className="text-destructive">Max 500 emails per batch.</span> : null}
							</div>
							{preview.invalid.length > 0 ? (
								<details className="text-sm">
									<summary className="cursor-pointer text-muted-foreground">Show invalid emails</summary>
									<pre className="mt-1 overflow-x-auto rounded bg-secondary/40 p-2 text-xs">{preview.invalid.join("\n")}</pre>
								</details>
							) : null}
							{result ? <p className="text-sm text-foreground">Processed {result.processed} email(s).</p> : null}
						</div>
					) : (
						<form action={inviteMemberAction} className="grid gap-3">
							<Input name="email" type="email" placeholder="member@example.com" required />
							<Input name="name" placeholder="Name optional" />
							<Button type="submit">Add one</Button>
						</form>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
