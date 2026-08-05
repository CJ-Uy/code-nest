import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PointTypeRow } from "@/db/repositories/pointTypes";
import type { MyHistorySummary, TermOption, TypedRetentionRecord } from "@/db/repositories/retention";

const STATUS_LABEL: Record<MyHistorySummary["status"], string> = {
	retained: "Retained",
	on_track: "On track",
	probation: "Probation",
};

export function RetentionHistory({
	summary,
	records,
	terms,
	selectedTermId,
	selectedPointTypeId,
	pointTypes,
}: {
	summary: MyHistorySummary | null;
	records: TypedRetentionRecord[];
	terms: TermOption[];
	selectedTermId: string;
	selectedPointTypeId: string | null;
	pointTypes: PointTypeRow[];
}) {
	const visibleRecords = selectedPointTypeId ? records.filter((record) => record.pointTypeId === selectedPointTypeId) : records;
	const totals = new Map<string, number>();
	for (const record of records) {
		totals.set(record.pointTypeId, (totals.get(record.pointTypeId) ?? 0) + (record.points ?? 0));
	}
	const milestoneTypes = pointTypes.filter((type) => (type.milestones?.length ?? 0) > 0);

	return (
		<div className="flex flex-col gap-4">
			<form method="get" className="flex items-center gap-2">
				{selectedPointTypeId ? <input type="hidden" name="pointTypeId" value={selectedPointTypeId} /> : null}
				<label className="text-sm text-muted-foreground" htmlFor="termId">
					Term
				</label>
				<select
					id="termId"
					name="termId"
					defaultValue={selectedTermId}
					className="rounded-md border border-border bg-background px-2 py-1 text-sm"
				>
					{terms.map((term) => (
						<option key={term.id} value={term.id}>
							{term.name}
							{term.isCurrent ? " (current)" : ""}
						</option>
					))}
				</select>
				<button type="submit" className="rounded-md border border-border px-3 py-1 text-sm">
					View
				</button>
			</form>

			{summary ? (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<CardTitle>{summary.termName}</CardTitle>
							<Badge variant={summary.status === "probation" ? "warn" : "secondary"}>
								{STATUS_LABEL[summary.status]}
							</Badge>
						</div>
						<CardDescription>
							{summary.totalPoints} points · retained at {summary.retainedAt} · {summary.recordCount} records
						</CardDescription>
					</CardHeader>
				</Card>
			) : (
				<p className="text-sm text-muted-foreground">No retention data for this term yet.</p>
			)}

			{milestoneTypes.length > 0 ? (
				<Card>
					<CardHeader>
						<CardTitle>Milestone progress</CardTitle>
						<CardDescription>Your points and targets for this term.</CardDescription>
					</CardHeader>
					<CardContent className="divide-y divide-border p-0">
						{milestoneTypes.map((type) => {
							const milestones = type.milestones ?? [];
							const points = totals.get(type.id) ?? 0;
							const next = milestones.find((milestone) => points < milestone.points);
							const target = next?.points ?? milestones.at(-1)?.points ?? 0;
							const progress = target > 0 ? Math.max(0, Math.min(100, Math.round((points / target) * 100))) : 100;
							return (
								<section key={type.id} className="grid gap-3 px-4 py-4">
									<div className="flex flex-wrap items-baseline justify-between gap-2">
										<h3 className="min-w-0 break-words font-semibold">{type.label}</h3>
										<span className="shrink-0 font-heading text-xl tabular-nums">{points} points</span>
									</div>
									<div
										role="progressbar"
										aria-label={`${type.label} milestone progress`}
										aria-valuemin={0}
										aria-valuemax={target}
										aria-valuenow={Math.max(0, Math.min(points, target))}
										className="h-2 overflow-hidden rounded-full bg-muted"
									>
										<div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
									</div>
									<ul className="grid gap-2">
										{milestones.map((milestone) => {
											const reached = points >= milestone.points;
											return (
												<li key={milestone.points} className="flex items-start justify-between gap-3 text-sm">
													<div className="min-w-0">
														<p
															className={reached ? "break-words font-medium" : "break-words text-muted-foreground"}
														>
															{milestone.title}
														</p>
														{milestone.description ? (
															<p className="mt-0.5 break-words text-xs text-muted-foreground">
																{milestone.description}
															</p>
														) : null}
													</div>
													<span className="shrink-0 tabular-nums">
														{milestone.points} pts {reached ? "✓" : ""}
													</span>
												</li>
											);
										})}
									</ul>
								</section>
							);
						})}
					</CardContent>
				</Card>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle>Records</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					{visibleRecords.length === 0 ? (
						<p className="text-sm text-muted-foreground">No records in this term.</p>
					) : (
						visibleRecords.map((record) => (
							<div
								key={record.id}
								className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
							>
								<div className="flex min-w-0 flex-col">
									<span className="break-all text-sm font-medium">{record.reason}</span>
									<span className="text-xs text-muted-foreground">
										{record.recordedAt.toISOString().slice(0, 10)} ·{" "}
										{record.source === "event_attendance" ? "Event" : "Manual"}
									</span>
								</div>
								<span className="min-w-0 break-all text-sm tabular-nums">
									{record.points ?? "n/a"} {record.pointTypeLabel}
								</span>
							</div>
						))
					)}
				</CardContent>
			</Card>
		</div>
	);
}
