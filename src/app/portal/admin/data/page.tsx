import Link from "next/link";
import { Download, Settings2 } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminIntro } from "@/components/portal/admin-intro";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { EventsPointsDashboard } from "./events-points-dashboard";
import { ManualRecordSheet } from "./manual-record-sheet";
import { loadAttendance, loadRetentionPickers } from "./retention/data";

export const dynamic = "force-dynamic";

export default async function DataGroupPage({
	searchParams,
}: {
	searchParams: Promise<{ termId?: string }>;
}) {
	const actor = await requireActor();
	if (!can(actor, "retention:record")) notFound();
	const params = await searchParams;
	const pickers = await loadRetentionPickers(actor);
	const now = new Date();
	const selectedTerm =
		pickers.terms.find((term) => term.id === params.termId) ??
		pickers.terms.find((term) => term.startsAt <= now && term.endsAt >= now) ??
		pickers.terms[0];
	const events = selectedTerm
		? pickers.events.filter((event) => event.startsAt >= selectedTerm.startsAt && event.startsAt <= selectedTerm.endsAt)
		: [];
	const repositories = await getRepositories();
	const [attendance, records] = selectedTerm
		? await Promise.all([
				loadAttendance(actor, events.map((event) => event.id)),
				repositories.retention.listForTerm(actor, selectedTerm.id),
			])
		: [[], []];

	return (
		<div className="grid gap-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<AdminIntro
					title="Events & points"
					whoFor="Review who attended each event and every point record"
					effect="Use Add manual record for adjustments and non-scan entries"
				/>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline">
						<Link href="/portal/admin/system/point-types">
							<Settings2 className="size-4" />
							Point types
						</Link>
					</Button>
					<Button asChild variant="outline">
						<Link href="/portal/admin/data/exports">
							<Download className="size-4" />
							Export
						</Link>
					</Button>
					<ManualRecordSheet
						members={pickers.members}
						terms={pickers.terms}
						events={pickers.events}
						pointTypes={pickers.pointTypes}
					/>
				</div>
			</div>

			<form className="flex flex-wrap items-end gap-2" method="get">
				<label className="grid min-w-56 gap-1 text-sm font-medium">
					School year
					<Select name="termId" defaultValue={selectedTerm?.id ?? ""}>
						{pickers.terms.map((term) => (
							<option key={term.id} value={term.id}>
								{term.label}
							</option>
						))}
					</Select>
				</label>
				<Button type="submit" variant="secondary">
					View
				</Button>
			</form>

			<EventsPointsDashboard
				events={events.map((event) => ({
					id: event.id,
					title: event.label,
					type: event.type,
					status: event.status,
					place: event.place,
					startsAt: event.startsAt.toISOString(),
				}))}
				attendance={attendance.map((row) => ({ ...row, scannedAt: row.scannedAt.toISOString() }))}
				records={records.map((row) => ({ ...row, recordedAt: row.recordedAt.toISOString() }))}
			/>
		</div>
	);
}
