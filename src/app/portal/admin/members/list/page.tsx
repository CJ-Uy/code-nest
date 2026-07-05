import { redirect } from "next/navigation";
import { getRepositories } from "@/db";
import { AdminIntro } from "@/components/portal/admin-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireActor } from "@/server/auth/actor";
import { can } from "@/server/auth/permissions";
import { inviteMemberAction, updateMemberStatusAction } from "./actions";

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
					<CardTitle>Invite member</CardTitle>
				</CardHeader>
				<CardContent>
					<form action={inviteMemberAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
						<Input name="email" type="email" placeholder="member@student.ateneo.edu" required />
						<Input name="name" placeholder="Name optional" />
						<Button type="submit">Invite</Button>
					</form>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Members ({members.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Email</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Set status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{members.map((member) => (
								<TableRow key={member.id}>
									<TableCell className="font-medium">{member.fullName ?? member.name ?? member.nickname ?? "Invited member"}</TableCell>
									<TableCell>{member.email}</TableCell>
									<TableCell><Badge variant={member.status === "active" ? "success" : member.status === "pending" ? "warn" : "outline"}>{member.status}</Badge></TableCell>
									<TableCell className="text-right">
										<form action={updateMemberStatusAction} className="inline-flex gap-1">
											<input type="hidden" name="id" value={member.id} />
											<Button name="status" value="pending" type="submit" size="sm" variant="outline">Pending</Button>
											<Button name="status" value="active" type="submit" size="sm" variant="outline">Active</Button>
											<Button name="status" value="inactive" type="submit" size="sm" variant="outline">Inactive</Button>
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
