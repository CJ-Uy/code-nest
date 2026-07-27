"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { EventTypeRow } from "@/db/repositories/eventTypeRules";
import { eventTypeColours } from "@/lib/event-type-colours";
import { permissionActions } from "@/server/auth/permissions";
import { upsertEventTypeAction } from "./actions";

type EventTypeFormProps = {
	row?: EventTypeRow;
};

function EventTypeForm({ row }: EventTypeFormProps) {
	const current = row?.requiredPermission ?? "";
	const isUnrecognized = current !== "" && !(permissionActions as readonly string[]).includes(current);

	return (
		<form action={upsertEventTypeAction} className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem_minmax(0,1fr)_auto_auto] lg:items-end">
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Type</span>
				{row ? (
					<>
						<input type="hidden" name="type" value={row.type} />
						<Badge variant="secondary" className="w-fit">{row.type}</Badge>
					</>
				) : (
					<Input name="type" required maxLength={32} pattern="[a-z0-9_]+" />
				)}
			</label>
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Label</span>
				<Input name="label" required maxLength={60} defaultValue={row?.label} />
			</label>
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Colour</span>
				<Select name="colour" defaultValue={row?.colour ?? eventTypeColours[0]}>
					{eventTypeColours.map((colour) => <option key={colour} value={colour}>{colour}</option>)}
				</Select>
			</label>
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Required permission</span>
				<Select name="requiredPermission" defaultValue={current}>
					<option value="">Any member</option>
					{isUnrecognized ? <option value={current}>{current} (unrecognized - locked to Super)</option> : null}
					{permissionActions.map((action) => <option key={action} value={action}>{action}</option>)}
				</Select>
			</label>
			<label className="flex h-10 items-center gap-2 text-sm font-medium">
				<input type="checkbox" name="active" defaultChecked={row?.active ?? true} />
				Active
			</label>
			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Position</span>
				<Input type="number" name="position" min={0} max={999} defaultValue={row?.position ?? 0} />
			</label>
			<Button type="submit" size="sm" variant="secondary">Save</Button>
		</form>
	);
}

export function EventTypeRulesManager({ rows }: { rows: EventTypeRow[] }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Event Types</CardTitle>
				<CardDescription>Manage event type labels, colours, permissions, availability, and display order.</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{rows.map((row) => <EventTypeForm key={row.type} row={row} />)}
				<EventTypeForm />
			</CardContent>
		</Card>
	);
}
