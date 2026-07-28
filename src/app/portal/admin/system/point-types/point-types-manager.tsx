"use client";

import { Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { PointTypeRow } from "@/db/repositories/pointTypes";
import { upsertPointTypeAction } from "./actions";

function PointTypeForm({ row }: { row?: PointTypeRow }) {
	return (
		<form action={upsertPointTypeAction} className="grid gap-3 border-t border-border pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto_7rem_auto] lg:items-end">
			<input type="hidden" name="id" value={row?.id ?? ""} />
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Key</span>
				{row ? (
					<>
						<input type="hidden" name="key" value={row.key} />
						<Badge variant="secondary" className="w-fit">{row.key}</Badge>
					</>
				) : (
					<Input name="key" required maxLength={40} pattern="[a-z0-9_]+" />
				)}
			</label>
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Label</span>
				<Input name="label" required maxLength={60} defaultValue={row?.label} />
			</label>
			<label className="flex h-10 items-center gap-2 text-sm font-medium">
				<Checkbox name="countsTowardRetention" defaultChecked={row?.countsTowardRetention ?? false} />
				Counts toward retention
			</label>
			<label className="flex h-10 items-center gap-2 text-sm font-medium">
				<Checkbox name="active" defaultChecked={row?.active ?? true} />
				Active
			</label>
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Position</span>
				<Input type="number" name="position" min={0} max={999} defaultValue={row?.position ?? 0} />
			</label>
			<Button type="submit" size="sm" variant="secondary">
				<Save />
				Save
			</Button>
		</form>
	);
}

export function PointTypesManager({ rows }: { rows: PointTypeRow[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Point Types</CardTitle>
				<CardDescription>Manage point labels, retention counting, availability, and display order.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{rows.map((row) => <PointTypeForm key={row.id} row={row} />)}
				<PointTypeForm />
			</CardContent>
		</Card>
	);
}
