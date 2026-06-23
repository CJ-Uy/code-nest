import Link from "next/link";
import { Trophy } from "lucide-react";
import { getRepositories } from "@/db";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/portal/empty-state";
import { MemberAvatar } from "@/components/portal/member-avatar";
import { RetentionHistory } from "@/components/retention-history";
import { requireActor } from "@/server/auth/actor";

export const dynamic = "force-dynamic";

function initialsFrom(name: string): string {
	const parts = name.trim().split(/\s+/).slice(0, 2);
	return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "M";
}

export default async function RetentionHistoryPage({
	searchParams,
}: {
	searchParams: Promise<{ termId?: string; view?: string }>;
}) {
	const actor = await requireActor();
	const params = await searchParams;
	const view = params.view === "leaderboard" ? "leaderboard" : "history";

	const repositories = await getRepositories();
	const terms = await repositories.retention.listTerms(actor).catch(() => []);
	const { summary, records } = await repositories.retention
		.myHistory(actor, { termId: params.termId })
		.catch(() => ({ summary: null, records: [] }));
	const selectedTermId = summary?.termId ?? params.termId ?? terms.find((term) => term.isCurrent)?.id ?? "";

	const leaderboard =
		view === "leaderboard" && selectedTermId
			? await repositories.retention.publicLeaderboard(actor, { termId: selectedTermId, limit: 25 }).catch(() => [])
			: [];

	const tabs = [
		{ id: "history", label: "My history", href: "/portal/events" },
		{ id: "leaderboard", label: "Leaderboard", href: "/portal/events?view=leaderboard" },
	];

	return (
		<div className="grid gap-5">
			<div>
				<p className="text-xs font-semibold uppercase text-primary">Member workspace</p>
				<h1 className="font-heading text-3xl">Retention</h1>
				<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
					Your points and where you stand this term.
				</p>
			</div>

			<div className="flex gap-2 border-b border-border">
				{tabs.map((tab) => (
					<Link
						key={tab.id}
						href={tab.href}
						className={
							view === tab.id
								? "-mb-px border-b-2 border-accent px-3 py-2 text-sm font-semibold text-foreground"
								: "-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
						}
					>
						{tab.label}
					</Link>
				))}
			</div>

			{view === "history" ? (
				<RetentionHistory summary={summary} records={records} terms={terms} selectedTermId={selectedTermId} />
			) : leaderboard.length === 0 ? (
				<EmptyState icon={Trophy} title="No points yet this term" description="Attend events to climb the leaderboard." />
			) : (
				<Card>
					<CardContent className="divide-y divide-border p-0">
						{leaderboard.map((row, rank) => {
							const name = row.fullName ?? row.name ?? "Member";
							const isMe = row.memberId === actor.memberId;
							return (
								<div
									key={row.memberId}
									className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-secondary/40" : ""}`}
								>
									<span className="w-6 text-center font-heading text-lg text-muted-foreground">{rank + 1}</span>
									<MemberAvatar initials={initialsFrom(name)} className="size-8 text-xs" />
									<span className="flex-1 truncate text-sm font-medium">
										{name}
										{isMe ? <span className="ml-2 text-xs text-accent">You</span> : null}
									</span>
									<span className="tabular-nums font-heading text-lg">{row.totalPoints}</span>
								</div>
							);
						})}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
