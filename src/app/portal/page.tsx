import { redirect } from "next/navigation";
import { CalendarDays, ClipboardCheck, Link2, MessageSquare } from "lucide-react";
import { getRepositories } from "@/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, RetentionProgress } from "@/components/portal/overview-metrics";
import { getActor } from "@/server/auth/actor";
import type { OverviewSummary } from "@/db/repositories/overview";

export const dynamic = "force-dynamic";

const EMPTY_SUMMARY: OverviewSummary = {
	retention: { points: 0, retainedAt: null, termName: null },
	pendingSurveys: 0,
	upcomingEvents: 0,
	linkClicks: 0,
};

export default async function PortalOverviewPage() {
	const actor = await getActor();
	if (!actor) redirect("/signin");

	const repositories = await getRepositories();
	// overview is unavailable through the shared-dev adapter until a future
	// phase wires an internal proxy route for it; degrade to zeroed metrics
	// instead of crashing the page.
	const summary = await repositories.overview.getSummary(actor).catch(() => EMPTY_SUMMARY);

	return (
		<div className="grid gap-5">
			<div>
				<p className="text-xs font-semibold uppercase text-primary">Member workspace</p>
				<h1 className="font-heading text-3xl">Overview</h1>
				<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
					Your retention progress, pending surveys, upcoming events, and link activity for the current term.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Retention"
					value={summary.retention.termName ? String(summary.retention.points) : "0"}
					description={summary.retention.termName ?? "No active term"}
					icon={ClipboardCheck}
				/>
				<MetricCard
					label="Surveys"
					value={String(summary.pendingSurveys)}
					description="Pending responses"
					icon={MessageSquare}
				/>
				<MetricCard
					label="Events"
					value={String(summary.upcomingEvents)}
					description="Upcoming approved events"
					icon={CalendarDays}
				/>
				<MetricCard
					label="Links"
					value={String(summary.linkClicks)}
					description="Clicks on your short links"
					icon={Link2}
				/>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Retention path</CardTitle>
					<CardDescription>{summary.retention.termName ?? "Current term"}</CardDescription>
				</CardHeader>
				<CardContent>
					<RetentionProgress points={summary.retention.points} retainedAt={summary.retention.retainedAt} />
				</CardContent>
			</Card>
		</div>
	);
}
