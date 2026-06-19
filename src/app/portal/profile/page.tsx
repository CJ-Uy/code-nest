import { redirect } from "next/navigation";
import { LogOut, Save } from "lucide-react";
import { signOut } from "@/auth";
import { getRepositories } from "@/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MemberCodeCard } from "@/components/member-code-card";
import { getActor } from "@/server/auth/actor";
import { updateProfileAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
	const actor = await getActor();
	if (!actor) redirect("/signin");

	const repositories = await getRepositories();
	const member = await repositories.members.getById(actor, actor.memberId);
	if (!member) redirect("/signin");

	return (
		<main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-3xl">Your profile</CardTitle>
					<CardDescription>Keep the member details used across the portal current.</CardDescription>
				</CardHeader>
				<CardContent>
					<form action={updateProfileAction} className="grid gap-5 sm:grid-cols-2">
						<Field label="Full name" name="fullName" defaultValue={member.fullName ?? member.name ?? ""} />
						<Field label="Nickname" name="nickname" defaultValue={member.nickname ?? ""} />
						<Field label="Pronouns" name="pronouns" defaultValue={member.pronouns ?? ""} />
						<Field label="Batch" name="batch" defaultValue={member.batch ?? ""} />
						<Field label="Birthday" name="birthday" type="date" defaultValue={member.birthday ?? ""} />
						<label className="flex items-center gap-3 self-end pb-2 text-sm font-medium">
							<Checkbox
								defaultChecked={member.birthdayPrivate}
								name="birthdayPrivate"
							/>
							Keep my birthday private
						</label>
						<div className="sm:col-span-2">
							<Button type="submit">
								<Save />
								Save profile
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
			<div className="mt-6">
				<MemberCodeCard memberId={actor.memberId} />
			</div>
			<form
				className="mt-6"
				action={async () => {
					"use server";
					await signOut({ redirectTo: "/" });
				}}
			>
				<Button type="submit" variant="outline">
					<LogOut />
					Sign out
				</Button>
			</form>
		</main>
	);
}

function Field({
	label,
	name,
	defaultValue,
	type = "text",
}: {
	label: string;
	name: string;
	defaultValue: string;
	type?: string;
}) {
	return (
		<label className="grid gap-2 text-sm font-medium">
			{label}
			<Input defaultValue={defaultValue} name={name} type={type} />
		</label>
	);
}
