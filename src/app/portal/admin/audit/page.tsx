import Link from "next/link";
import { redirect } from "next/navigation";
import { getRepositories } from "@/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/portal/empty-state";
import { ScrollText } from "lucide-react";
import { getActor } from "@/server/auth/actor";
import { hasAnyAdminScope } from "@/server/auth/admin";
import type { AuditCategory } from "@/db/repositories/audit";

export const dynamic = "force-dynamic";

const CATEGORIES: AuditCategory[] = [
	"role",
	"event",
	"retention",
	"survey",
	"link",
	"member",
	"announcement",
	"library",
];

function formatWhen(value: Date): string {
	return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function AdminAuditPage({
	searchParams,
}: {
	searchParams: Promise<{ category?: string }>;
}) {
	const actor = await getActor();
	if (!actor) redirect("/signin");
	if (!hasAnyAdminScope(actor)) redirect("/portal");

	const params = await searchParams;
	const category = CATEGORIES.includes(params.category as AuditCategory) ? (params.category as AuditCategory) : undefined;
	const repositories = await getRepositories();
	const entries = await repositories.audit.list(actor, { category, limit: 100 }).catch(() => []);

	return (
		<div className="grid gap-5">
			<div>
				<h2 className="font-heading text-xl">Audit log</h2>
				<p className="text-sm text-muted-foreground">The most recent 100 recorded actions.</p>
			</div>

			<div className="flex flex-wrap gap-2">
				<FilterChip label="All" href="/portal/admin/audit" active={!category} />
				{CATEGORIES.map((cat) => (
					<FilterChip key={cat} label={cat} href={`/portal/admin/audit?category=${cat}`} active={category === cat} />
				))}
			</div>

			{entries.length === 0 ? (
				<EmptyState icon={ScrollText} title="No audit entries" description="Recorded actions will appear here." />
			) : (
				<Card>
					<CardContent className="divide-y divide-border p-0">
						{entries.map((entry) => (
							<div key={entry.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
								<Badge variant="secondary" className="capitalize">
									{entry.category}
								</Badge>
								<span className="font-medium">{entry.action}</span>
								<span className="text-muted-foreground">
									{entry.targetType}:{entry.targetId.slice(0, 16)}
								</span>
								<span className="ml-auto text-xs text-muted-foreground">{formatWhen(entry.createdAt)}</span>
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function FilterChip({ label, href, active }: { label: string; href: string; active: boolean }) {
	return (
		<Link
			href={href}
			className={
				active
					? "rounded-full border border-accent bg-secondary px-3 py-1 text-xs font-medium capitalize text-foreground"
					: "rounded-full border border-border px-3 py-1 text-xs font-medium capitalize text-muted-foreground hover:text-foreground"
			}
		>
			{label}
		</Link>
	);
}
