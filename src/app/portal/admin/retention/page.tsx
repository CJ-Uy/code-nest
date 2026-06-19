import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { loadRetentionPickers } from "./data";
import { RetentionForm } from "./retention-form";

export const dynamic = "force-dynamic";

export default async function RetentionAdminPage() {
	const actor = await getActor();
	if (!actor) redirect("/signin");
	if (!can(actor, "retention:record")) notFound();

	const { members, terms, events } = await loadRetentionPickers(actor).catch(() => ({
		members: [],
		terms: [],
		events: [],
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-3xl">Log retention records</CardTitle>
				<CardDescription>
					Record non-event retention items. Pick the members, the term, optionally an event, write the reason,
					and add a point value if it applies. Points may be left blank or set negative for a deduction.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<RetentionForm members={members} termOptions={terms} eventOptions={events} />
			</CardContent>
		</Card>
	);
}
