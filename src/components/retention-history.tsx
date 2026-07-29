import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
}: {
	summary: MyHistorySummary | null;
	records: TypedRetentionRecord[];
	terms: TermOption[];
	selectedTermId: string;
	selectedPointTypeId: string | null;
}) {
	const visibleRecords = selectedPointTypeId ? records.filter((record) => record.pointTypeId === selectedPointTypeId) : records;

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