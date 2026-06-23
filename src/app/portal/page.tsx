import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, ClipboardCheck, Link2, Megaphone, MessageSquare } from "lucide-react";
import { getRepositories } from "@/db";
import { EventScanPanel } from "@/components/event-scan-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, RetentionProgress } from "@/components/portal/overview-metrics";
import { getActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
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
	// Each read degrades to an empty/zeroed value so the dashboard never crashes
	// when a repository is unavailable through the shared-dev adapter.
	const [member, summary, announcements, libraryItems] = await Promise.all([
		repositories.members.getById(actor, actor.memberId).catch(() => null),
		repositories.overview.getSummary(actor).catch(() => EMPTY_SUMMARY),
		repositories.announcements.listForMember(actor, { limit: 3 }).catch(() => []),
		repositories.library.listItems(actor, { limit: 3 }).catch(() => []),
	]);

	const firstName = (member?.nickname ?? member?.fullName ?? member?.name ?? "there").split(/\s+/)[0];
	const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

	const canScanAttendance = can(actor, "points:assign");
	let scanEvent: Awaited<ReturnType<typeof repositories.events.listApproved>>[number] | null = null;
	if (canScanAttendance) {
		try {
			const [event] = await repositories.events.listApproved(actor, { limit: 1 });
			scanEvent = event ?? null;
		} catch {
			scanEvent = null;
		}
	}
	const currentTermId = "term_2026_1";

	return (
		<div className="grid gap-6">
			<div>
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{today}</p>
				<h1 className="font-heading text-3xl">Kumusta, {firstName}</h1>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<MetricCard
					label="Retention"
					value={summary.retention.termName ? String(summary.retention.points) : "0"}
					description={summary.retention.termName ?? "No active term"}
					icon={ClipboardCheck}
				/>
				<MetricCard label="Surveys" value={String(summary.pendingSurveys)} description="Pending responses" icon={MessageSquare} />
				<MetricCard label="Events" value={String(summary.upcomingEvents)} description="Upcoming approved events" icon={CalendarDays} />
				<MetricCard label="Links" value={String(summary.linkClicks)} description="Clicks on your short links" icon={Link2} />
			</div>

			<div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
				<div className="grid gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Retention path</CardTitle>
							<CardDescription>{summary.retention.termName ?? "Current term"}</CardDescription>
						</CardHeader>
						<CardContent>
							<RetentionProgress points={summary.retention.points} retainedAt={summary.retention.retainedAt} />
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex-row items-center justify-between space-y-0">
							<div className="flex items-center gap-2">
								<Megaphone className="size-4 text-accent" />
								<CardTitle className="text-lg">Announcements</CardTitle>
							</div>
							<Link href="/portal/announcements" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
								See all
								<ArrowRight className="size-3.5" />
							</Link>
						</CardHeader>
						<CardContent className="grid gap-3">
							{announcements.length === 0 ? (
								<p className="text-sm text-muted-foreground">No announcements right now.</p>
							) : (
								announcements.map((item) => (
									<div key={item.id} className="flex items-start gap-3">
										<Badge variant="info" className="mt-0.5 shrink-0">
											{item.tag}
										</Badge>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium">{item.title}</p>
											<p className="line-clamp-1 text-xs text-muted-foreground">{item.body}</p>
										</div>
										{item.unread ? <span className="ml-auto mt-1.5 size-2 shrink-0 rounded-full bg-accent" /> : null}
									</div>
								))
							)}
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader className="flex-row items-center justify-between space-y-0">
						<div className="flex items-center gap-2">
							<BookOpen className="size-4 text-accent" />
							<CardTitle className="text-lg">From the library</CardTitle>
						</div>
						<Link href="/portal/library" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
							Browse
							<ArrowRight className="size-3.5" />
						</Link>
					</CardHeader>
					<CardContent className="grid gap-3">
						{libraryItems.length === 0 ? (
							<p className="text-sm text-muted-foreground">No library items yet.</p>
						) : (
							libraryItems.map((item) => (
								<Link
									key={item.id}
									href={`/portal/library/${item.id}`}
									className="group grid gap-1 rounded-lg border border-border p-3 transition-colors hover:border-accent"
								>
									<span className="text-xs text-muted-foreground">{item.category}</span>
									<span className="text-sm font-medium leading-snug group-hover:text-accent">{item.title}</span>
								</Link>
							))
						)}
					</CardContent>
				</Card>
			</div>

			{scanEvent ? <EventScanPanel eventId={scanEvent.id} termId={currentTermId} /> : null}
		</div>
	);
}
