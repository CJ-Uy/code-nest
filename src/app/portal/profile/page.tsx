import { redirect } from "next/navigation";
import { Award, CalendarDays, Link2, Save } from "lucide-react";
import { getRepositories } from "@/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MemberAvatar } from "@/components/portal/member-avatar";
import { MemberCodeCard } from "@/components/member-code-card";
import { getActor } from "@/server/auth/actor";
import type { OverviewSummary } from "@/db/repositories/overview";
import { updateProfileAction } from "./actions";

export const dynamic = "force-dynamic";

const EMPTY_SUMMARY: OverviewSummary = {
	retention: { points: 0, retainedAt: null, termName: null },
	pendingSurveys: 0,
	upcomingEvents: 0,
	linkClicks: 0,
};

function initialsFrom(name: string): string {
	const parts = name.trim().split(/\s+/).slice(0, 2);
	return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "M";
}

export default async function ProfilePage() {
	const actor = await getActor();
	if (!actor) redirect("/signin");

	const repositories = await getRepositories();
	const member = await repositories.members.getById(actor, actor.memberId);
	if (!member) redirect("/signin");
	const summary = await repositories.overview.getSummary(actor).catch(() => EMPTY_SUMMARY);

	const displayName = member.nickname ?? member.fullName ?? member.name ?? member.email;
	const subtitle = [member.pronouns, member.batch].filter(Boolean).join(" · ");

	const stats = [
		{ label: "Retention", value: summary.retention.termName ? summary.retention.points : 0, icon: Award },
		{ label: "Upcoming events", value: summary.upcomingEvents, icon: CalendarDays },
		{ label: "Link clicks", value: summary.linkClicks, icon: Link2 },
	];

	return (
		<div className="grid gap-6">
			<Card className="overflow-hidden">
				<div className="h-20 bg-primary" aria-hidden />
				<CardContent className="pt-0">
					<MemberAvatar initials={initialsFrom(displayName)} className="-mt-10 size-20 text-2xl ring-4 ring-card" />
					<div className="mt-3 min-w-0">
						<h1 className="font-heading text-2xl text-foreground">{member.fullName ?? member.name ?? displayName}</h1>
						<p className="text-sm text-muted-foreground">{subtitle || member.email}</p>
					</div>
					<dl className="mt-6 grid grid-cols-3 gap-3">
						{stats.map((stat) => {
							const Icon = stat.icon;
							return (
								<div key={stat.label} className="rounded-xl border border-border bg-background p-3 text-center">
									<Icon className="mx-auto size-4 text-accent" />
									<dd className="mt-1 font-heading text-xl text-foreground">{stat.value}</dd>
									<dt className="text-xs text-muted-foreground">{stat.label}</dt>
								</div>
							);
						})}
					</dl>
				</CardContent>
			</Card>

			<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
				<MemberCodeCard memberId={actor.memberId} className="lg:order-last" />
				<Card className="lg:order-first">
					<CardHeader>
						<CardTitle>Edit profile</CardTitle>
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
								<Checkbox defaultChecked={member.birthdayPrivate} name="birthdayPrivate" />
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
			</div>
		</div>
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
