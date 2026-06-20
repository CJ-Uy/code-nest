import { asc, desc } from "drizzle-orm";
import { Download } from "lucide-react";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getDb } from "@/db/client";
import { crsEvents, terms } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";

export const dynamic = "force-dynamic";

export default async function ReportingAdminPage() {
	const actor = await requireActor();
	if (!can(actor, "retention:record")) redirect("/portal/admin");
	const db = getDb();
	const [termList, eventList] = await Promise.all([
		db.select().from(terms).orderBy(asc(terms.startsAt)),
		db.select().from(crsEvents).orderBy(desc(crsEvents.startsAt)).limit(50),
	]);

	return (
		<div className="grid gap-6 lg:grid-cols-3">
			<ExportBlockedCard title="Whole-term master" description="Every retention record in a term, one row per record.">
				<Select disabled>
					{termList.map((term) => (
						<option key={term.id}>{term.name}</option>
					))}
				</Select>
			</ExportBlockedCard>

			<ExportBlockedCard title="Per-event roster" description="Who signed up and who was scanned in, per event.">
				<Select disabled>
					{eventList.map((event) => (
						<option key={event.id}>{event.title}</option>
					))}
				</Select>
			</ExportBlockedCard>

			<ExportBlockedCard title="Per-member history" description="One member's full-year retention history for a selected term.">
				<Select disabled>
					{termList.map((term) => (
						<option key={term.id}>{term.name}</option>
					))}
				</Select>
				<Input disabled placeholder="Member id" />
			</ExportBlockedCard>
		</div>
	);
}

function ExportBlockedCard({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-3">
				{children}
				{/* ponytail: export route stays unimplemented until xlsx install is approved. */}
				<p className="text-sm text-muted-foreground">Xlsx export is pending dependency approval.</p>
				<Button type="button" size="sm" variant="outline" disabled>
					<Download className="size-4" />
					Export xlsx
				</Button>
			</CardContent>
		</Card>
	);
}
