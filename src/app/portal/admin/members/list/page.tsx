import Link from "next/link";
import { redirect } from "next/navigation";
import { getRepositories } from "@/db";
import { AdminIntro } from "@/components/portal/admin-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { deleteMemberAction } from "./actions";
import { AddMembers } from "./add-members";
import { MemberListFilters } from "./member-list-filters";

export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined): string {
	return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function href(page: number, q: string, rows: number): string {
	const params = new URLSearchParams();
	if (q) params.set("q", q);
	params.set("rows", String(rows));
	params.set("page", String(page));
	return `/portal/admin/members/list?${params.toString()}`;
}

export default async function MemberListPage({ searchParams }: { searchParams?: Promise<Params> }) {
	const actor = await requireActor();
	if (!can(actor, "member:manage")) redirect("/portal/admin");
	const params = (await searchParams) ?? {};
	const q = one(params.q).trim().toLowerCase();
	const rows = [25, 50, 100].includes(Number(one(params.rows))) ? Number(one(params.rows)) : 25;
	const page = Math.max(1, Number(one(params.page)) || 1);
	const repositories = await getRepositories();
	const members = await repositories.members.list(actor, { limit: 1000 });
	const filtered = q
		? members.filter((member) =>
				[member.email, member.fullName, member.name, member.nickname].some((value) => value?.toLowerCase().includes(q)),
			)
		: members;
	const totalPages = Math.max(1, Math.ceil(filtered.length / rows));
	const currentPage = Math.min(page, totalPages);
	const start = (currentPage - 1) * rows;
	const visible = filtered.slice(start, start + rows);

	return (
		<div className="grid gap-4">
			<AdminIntro title="Member List" whoFor="Invite members by exact email" effect="Pending members can receive admin roles before first sign-in" />
			<Card>
				<CardHeader className="gap-3">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<CardTitle>Members ({filtered.length})</CardTitle>
						<AddMembers />
					</div>
					<div className="flex flex-wrap items-end gap-2">
						<MemberListFilters q={q} rows={rows} />
						{q ? <Button asChild variant="ghost"><Link href="/portal/admin/members/list">Clear</Link></Button> : null}
					</div>
				</CardHeader>
				<CardContent className="grid gap-4">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{visible.map((member) => (
								<TableRow key={member.id}>
									<TableCell className="font-medium">{member.fullName ?? member.name ?? member.nickname ?? "Invited member"}</TableCell>
									<TableCell>{member.email}</TableCell>
									<TableCell><Badge variant={member.status === "active" ? "success" : member.status === "pending" ? "warn" : "outline"}>{member.status}</Badge></TableCell>
									<TableCell className="text-right">
										<form action={deleteMemberAction}>
											<input type="hidden" name="id" value={member.id} />
											<Button type="submit" variant="outline" size="sm" className="text-destructive" disabled={member.id === actor.memberId}>
												Delete
											</Button>
										</form>
									</TableCell>
								</TableRow>
							))}
							{visible.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
										No members found.
									</TableCell>
								</TableRow>
							) : null}
						</TableBody>
					</Table>
					<div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
						<p>
							Showing {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + rows, filtered.length)} of {filtered.length}
						</p>
						<div className="flex items-center gap-2">
							<Button asChild variant="outline" size="sm" aria-disabled={currentPage <= 1}>
								<Link href={href(Math.max(1, currentPage - 1), q, rows)} className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}>
									Previous
								</Link>
							</Button>
							<span>
								Page {currentPage} of {totalPages}
							</span>
							<Button asChild variant="outline" size="sm" aria-disabled={currentPage >= totalPages}>
								<Link href={href(Math.min(totalPages, currentPage + 1), q, rows)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}>
									Next
								</Link>
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
