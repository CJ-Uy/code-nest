"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Lock, Plus, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PointTypeRow } from "@/db/repositories/pointTypes";
import { RETENTION_POINT_TYPE_ID } from "@/lib/point-types";
import { cn } from "@/lib/utils";
import { savePointTypesAction, upsertPointTypeAction } from "./actions";

function move<T>(items: T[], from: number, to: number): T[] {
	const next = [...items];
	const [item] = next.splice(from, 1);
	if (item) next.splice(to, 0, item);
	return next;
}

function AddPointType({ position }: { position: number }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Add point type</CardTitle>
				<CardDescription>Create a reusable point category for event awards and member totals.</CardDescription>
			</CardHeader>
			<CardContent>
				<form action={upsertPointTypeAction} className="grid gap-4">
					<input type="hidden" name="id" value="" />
					<div className="grid gap-4 sm:grid-cols-2">
						<label className="grid gap-1.5 text-sm">
							<span className="font-medium">Key</span>
							<Input name="key" required maxLength={40} pattern="[a-z0-9_]+" placeholder="project_lead" />
							<span className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores.</span>
						</label>
						<label className="grid gap-1.5 text-sm">
							<span className="font-medium">Label</span>
							<Input name="label" required maxLength={60} placeholder="Project Lead" />
						</label>
					</div>
					<label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
						<input type="checkbox" name="active" defaultChecked className="mt-0.5 size-4 accent-primary" />
						<span>
							<span className="block font-medium">Available for awards</span>
							<span className="text-muted-foreground">Show this type when admins assign event points.</span>
						</span>
					</label>
					<input type="hidden" name="position" value={position} />
					<div>
						<Button type="submit">
							<Plus />
							Add point type
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

function PointTypeEditor({
	row,
	index,
	count,
	formId,
	dragging,
	onDragStart,
	onDragOver,
	onDragEnd,
	onMove,
}: {
	row: PointTypeRow;
	index: number;
	count: number;
	formId: string;
	dragging: boolean;
	onDragStart: () => void;
	onDragOver: () => void;
	onDragEnd: () => void;
	onMove: (to: number) => void;
}) {
	return (
		<li
			onDragOver={(event) => {
				event.preventDefault();
				onDragOver();
			}}
			onDrop={onDragEnd}
			className={cn(
				"grid gap-4 rounded-lg border border-border bg-background p-4 transition-colors",
				dragging && "border-ring bg-muted/50",
			)}
		>
			<input type="hidden" name="ids" value={row.id} form={formId} />
			<input type="hidden" name="keys" value={row.key} form={formId} />
			<div className="flex min-w-0 items-center gap-3">
				<button
					type="button"
					draggable
					onDragStart={onDragStart}
					onDragEnd={onDragEnd}
					onKeyDown={(event) => {
						if (event.key === "ArrowUp" && index > 0) {
							event.preventDefault();
							onMove(index - 1);
						}
						if (event.key === "ArrowDown" && index < count - 1) {
							event.preventDefault();
							onMove(index + 1);
						}
					}}
					className="flex cursor-grab items-center gap-1 text-muted-foreground active:cursor-grabbing"
					aria-label={`Drag ${row.label} to reorder`}
					title="Drag to reorder"
				>
					<GripVertical className="size-5" />
					<span className="w-5 text-center text-sm tabular-nums">{index + 1}</span>
				</button>
				<div className="min-w-0 flex-1">
					<p className="truncate font-semibold">{row.label}</p>
					<div className="mt-1 flex flex-wrap items-center gap-1.5">
						<Badge variant="secondary" className="max-w-full break-all">
							{row.key}
						</Badge>
						<Badge variant={row.active ? "success" : "outline"}>{row.active ? "Available" : "Inactive"}</Badge>
					</div>
				</div>
				<div className="flex shrink-0">
					<Button
						type="button"
						size="icon"
						variant="ghost"
						disabled={index === 0}
						onClick={() => onMove(index - 1)}
						aria-label={`Move ${row.label} up`}
						title="Move up"
					>
						<ArrowUp />
					</Button>
					<Button
						type="button"
						size="icon"
						variant="ghost"
						disabled={index === count - 1}
						onClick={() => onMove(index + 1)}
						aria-label={`Move ${row.label} down`}
						title="Move down"
					>
						<ArrowDown />
					</Button>
				</div>
			</div>

			<label className="grid gap-1.5 text-sm">
				<span className="font-medium">Label</span>
				<Input name="labels" form={formId} required maxLength={60} defaultValue={row.label} />
			</label>

			<label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
				{row.id === RETENTION_POINT_TYPE_ID ? (
					<>
						<input type="hidden" name="activeIds" value={row.id} form={formId} />
						<span
							className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
							title="Retention always exists and cannot be retired."
						>
							<Lock className="size-3.5" aria-hidden />
							Always active
						</span>
					</>
				) : (
					<input
						type="checkbox"
						name="activeIds"
						value={row.id}
						form={formId}
						defaultChecked={row.active}
						className="mt-0.5 size-4 accent-primary"
					/>
				)}
				<span>
					<span className="block font-medium">Available for awards</span>
					<span className="text-muted-foreground">Show this type when admins assign event points.</span>
				</span>
			</label>
		</li>
	);
}

export function PointTypesManager({ rows }: { rows: PointTypeRow[] }) {
	const [items, setItems] = useState(rows);
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const saveFormId = "point-types-save-form";

	function moveTo(id: string, to: number) {
		const from = items.findIndex((item) => item.id === id);
		if (from >= 0 && to >= 0 && to < items.length) setItems((current) => move(current, from, to));
	}

	function dragOver(id: string) {
		if (!draggingId || draggingId === id) return;
		const to = items.findIndex((item) => item.id === id);
		moveTo(draggingId, to);
	}

	const nextPosition = Math.min(999, Math.max(-1, ...items.map((item) => item.position)) + 1);

	return (
		<div className="grid gap-6">
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div className="grid gap-1.5">
							<CardTitle>Point types</CardTitle>
							<CardDescription>Drag types into order, edit their rules, then save all changes once.</CardDescription>
						</div>
						<Button type="submit" form={saveFormId} disabled={items.length === 0}>
							<Save />
							Save changes
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					<form id={saveFormId} action={savePointTypesAction} />
					{items.length === 0 ? (
						<p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
							No point types yet. Add the first one below.
						</p>
					) : (
						<ol className="grid gap-3">
							{items.map((row, index) => (
								<PointTypeEditor
									key={row.id}
									row={row}
									index={index}
									count={items.length}
									formId={saveFormId}
									dragging={draggingId === row.id}
									onDragStart={() => setDraggingId(row.id)}
									onDragOver={() => dragOver(row.id)}
									onDragEnd={() => setDraggingId(null)}
									onMove={(to) => moveTo(row.id, to)}
								/>
							))}
						</ol>
					)}
				</CardContent>
			</Card>

			<AddPointType position={nextPosition} />
		</div>
	);
}
