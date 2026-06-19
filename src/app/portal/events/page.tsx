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
		<main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
			<h1 className="mb-4 font-heading text-2xl">My Retention History</h1>
			<RetentionHistory summary={summary} records={records} terms={terms} selectedTermId={selectedTermId} />
		</main>
	);
}
