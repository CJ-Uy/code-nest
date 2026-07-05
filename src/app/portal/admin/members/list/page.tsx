import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getRepositories } from "@/db";
import { getDb } from "@/db/client";
import { terms } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminIntro } from "@/components/portal/admin-intro";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { addRosterEntryAction, removeRosterEntryAction } from "./actions";
import { BulkAdd } from "./bulk-add";

export const dynamic = "force-dynamic";

export default async function RosterAdminPage({ searchParams }: { searchParams: Promise<{ termId?: string }> }) {
	const actor = await requireActor();
	if (!can(actor, "roster:manage")) redirect("/portal/admin");
	const { termId } = await searchParams;
	const termList = await getDb().select().from(terms).orderBy(asc(terms.startsAt));
	const activeTermId = termId ?? termList.at(-1)?.id ?? null;
	const repositories = await getRepositories();
	// roster has no shared-dev internal proxy yet; degrade to an empty list instead of crashing.
	const roster = activeTermId ? await repositories.roster.listForTerm(actor, activeTermId).catch(() => []) : [];

	return (
		<div className="grid gap-6">
			<AdminIntro
				title="Member List"
				whoFor="The official members of CODE for a term"
				effect="Adding an email lets that person sign in; they link automatically on first login"
			/>
			<Card>
				<CardHeader>
					<CardTitle>Pick a term</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					{termList.map((term) => (
						<Button key={term.id} asChild size="sm" variant={term.id === activeTermId ? "default" : "outline"}>
							<a href={`/portal/admin/members/list?termId=${term.id}`}>{term.name}</a>
						</Button>
					))}
				</CardContent>
			</Card>

			{activeTermId ? (
				<Card>
					<CardHeader>
						<CardTitle>Member List ({roster.length})</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4">
						<form action={addRosterEntryAction} className="flex flex-wrap items-end gap-2">
							<input type="hidden" name="termId" value={activeTermId} />
							<Input name="email" type="email" placeholder="member@example.com" required className="max-w-xs" />
							<Button type="submit">Add one</Button>
						</form>

						<BulkAdd termId={activeTermId} />

						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Email</TableHead>
									<TableHead>Linked member</TableHead>
									<TableHead className="text-right">Action</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{roster.map((entry) => (
									<TableRow key={entry.email}>
										<TableCell>{entry.email}</TableCell>
										<TableCell>{entry.memberId ? "Yes" : "Not yet signed in"}</TableCell>
										<TableCell className="text-right">
											<form action={removeRosterEntryAction}>
												<input type="hidden" name="termId" value={activeTermId} />
												<input type="hidden" name="email" value={entry.email} />
												<Button type="submit" size="sm" variant="outline">
													Remove
												</Button>
											</form>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			) : (
				<p className="text-sm text-muted-foreground">No terms exist yet. Create a term first.</p>
			)}
		</div>
	);
}
