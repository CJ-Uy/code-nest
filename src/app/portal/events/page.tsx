import { getRepositories } from "@/db";
import { requireActor } from "@/server/auth/actor";
import { RetentionHistory } from "@/components/retention-history";

export const dynamic = "force-dynamic";

export default async function RetentionHistoryPage({
	searchParams,
}: {
	searchParams: Promise<{ termId?: string }>;
}) {
	const actor = await requireActor();
	const params = await searchParams;

	const repositories = await getRepositories();
	const terms = await repositories.retention.listTerms(actor).catch(() => []);
	const { summary, records } = await repositories.retention
		.myHistory(actor, { termId: params.termId })
		.catch(() => ({ summary: null, records: [] }));
	const selectedTermId = summary?.termId ?? params.termId ?? terms.find((term) => term.isCurrent)?.id ?? "";

	return (
		<div className="grid gap-5">
			<div>
				<p className="text-xs font-semibold uppercase text-primary">Member workspace</p>
				<h1 className="font-heading text-3xl">Retention history</h1>
				<p className="mt-1 max-w-2xl text-sm text-muted-foreground">
					Your points, retained status, and the record behind every change this term.
				</p>
			</div>
			<RetentionHistory summary={summary} records={records} terms={terms} selectedTermId={selectedTermId} />
		</div>
	);
}
