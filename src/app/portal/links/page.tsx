import { Link2 } from "lucide-react";
import { getRepositories } from "@/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireActor } from "@/server/auth/actor";
import { createLinkAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
	const actor = await requireActor();
	const { links } = await getRepositories();
	const rows = await links.listVisible(actor, { limit: 100 });
	const mine = rows.filter((link) => link.ownerMemberId === actor.memberId).length;

	return (
		<div className="grid gap-5">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="text-xs font-semibold uppercase text-primary">Short links</p>
					<h1 className="font-heading text-3xl">Link shortener</h1>
					<p className="mt-1 max-w-2xl text-sm text-muted-foreground">Create rooted CODE links and keep existing redirects working.</p>
				</div>
				<Badge variant="info">{mine} owned by you</Badge>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Create short link</CardTitle>
					<CardDescription>Use letters, numbers, and dashes for the custom ending.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={createLinkAction} className="grid gap-3 md:grid-cols-[180px_1fr_220px_auto]">
						<Input name="slug" placeholder="welcome" aria-label="Custom ending" required />
						<Input name="destinationUrl" type="url" placeholder="https://example.com" aria-label="Destination URL" required />
						<Input name="title" placeholder="Welcome page" aria-label="Title" required />
						<Button type="submit">
							<Link2 />
							Create
						</Button>
					</form>
				</CardContent>
			</Card>

			<div className="overflow-x-auto rounded-lg border bg-card">
				<table className="w-full min-w-[720px] text-left text-sm">
					<thead className="text-xs uppercase text-muted-foreground">
						<tr className="border-b">
							<th className="px-4 py-3">Short link</th>
							<th>Title</th>
							<th>Destination</th>
							<th className="text-right">Clicks</th>
							<th className="px-4">Owner</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((link) => (
							<tr className="border-b last:border-0" key={link.id}>
								<td className="px-4 py-3 font-mono">
									<a className="text-primary hover:underline" href={`/${link.slug}`} target="_blank" rel="noreferrer">
										/{link.slug}
									</a>
								</td>
								<td>{link.title}</td>
								<td className="max-w-sm truncate text-muted-foreground">{link.destinationUrl}</td>
								<td className="text-right tabular-nums">{link.clickCount}</td>
								<td className="px-4">{link.owner?.name ?? link.owner?.email ?? "Member"}</td>
							</tr>
						))}
						{rows.length === 0 ? (
							<tr>
								<td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
									No short links yet.
								</td>
							</tr>
						) : null}
					</tbody>
				</table>
			</div>
		</div>
	);
}
