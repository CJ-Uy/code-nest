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

export const dynamic = "force-dynamic";

export default async function MemberListPage() {
	const actor = await requireActor();
	if (!can(actor, "member:manage")) redirect("/portal/admin");
	const repositories = await getRepositories();
	const members = await repositories.members.list(actor, { limit: 50 });

	return (
		<div className="grid gap-4">
			<AdminIntro title="Member List" whoFor="Invite members by exact email" effect="Pending members can receive admin roles before first sign-in" />
			<Card>
				<CardHeader>
					<CardTitle>Members ({members.length})</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4">
					<AddMembers />
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
							{members.map((member) => (
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
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
