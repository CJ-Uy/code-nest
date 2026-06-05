"use client";

import {
	Archive,
	Bell,
	CalendarDays,
	Camera,
	ChevronRight,
	CircleUserRound,
	ClipboardCheck,
	FileText,
	Heart,
	KeyRound,
	Link2,
	MessageSquare,
	QrCode,
	Search,
	ShieldCheck,
	Sparkles,
	UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TabsList, TabButton } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const modules = [
	{ id: "overview", label: "Overview", icon: CircleUserRound },
	{ id: "library", label: "Library", icon: Archive },
	{ id: "links", label: "Links", icon: Link2 },
	{ id: "crs", label: "CRS", icon: ClipboardCheck },
	{ id: "calendar", label: "Calendar", icon: CalendarDays },
	{ id: "announcements", label: "Announcements", icon: Bell },
	{ id: "admin", label: "Admin", icon: ShieldCheck },
] as const;

type ModuleId = (typeof modules)[number]["id"];

const resources = [
	{ title: "Partner org intervention", type: "Case", access: "Confidential", topic: "Consulting", comments: 12 },
	{ title: "XChange retrospective", type: "Case", access: "Confidential", topic: "Formation", comments: 8 },
	{ title: "Event planning checklist", type: "Tool", access: "Member", topic: "Retention", comments: 5 },
	{ title: "Consultant handoff notes", type: "Article", access: "Confidential", topic: "Consulting", comments: 9 },
];

const links = [
	{ slug: "/yhk", destination: "Youth Huddle kit", owner: "Sam Dela Cruz", clicks: 184, status: "Own link" },
	{ slug: "/ga", destination: "General Assembly calendar", owner: "Mika Reyes", clicks: 332, status: "Stats open" },
	{ slug: "/feedback", destination: "Retention survey form", owner: "Rafa Lim", clicks: 91, status: "Stats open" },
];

const events = [
	{ day: "05", title: "Member dinner", type: "Casual", tone: "success" },
	{ day: "09", title: "General Assembly", type: "Official", tone: "info" },
	{ day: "10", title: "CRS proof due", type: "Deadline", tone: "warn" },
	{ day: "11", title: "Bea birthday", type: "Birthday", tone: "secondary" },
	{ day: "20", title: "Study night", type: "Official", tone: "info" },
];

const adminQueue = [
	{ item: "Retention Night proof", role: "CRS admin", risk: "Needs decision", action: "Review" },
	{ item: "Youth Huddle survey sample", role: "CRS admin", risk: "Formula check", action: "Select" },
	{ item: "/feedback destination change", role: "Link admin", risk: "Audit note", action: "Moderate" },
	{ item: "CRS rules announcement", role: "Publishing admin", risk: "Draft", action: "Publish" },
];

function Metric({
	label,
	value,
	description,
	icon: Icon,
}: {
	label: string;
	value: string;
	description: string;
	icon: typeof Heart;
}) {
	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
				<CardDescription>{label}</CardDescription>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-semibold">{value}</div>
				<p className="mt-1 text-xs text-muted-foreground">{description}</p>
			</CardContent>
		</Card>
	);
}

function SectionTitle({
	kicker,
	title,
	children,
}: {
	kicker: string;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex flex-col gap-1">
			<p className="text-xs font-semibold uppercase text-primary">{kicker}</p>
			<h2 className="text-xl font-bold text-foreground">{title}</h2>
			<p className="max-w-2xl text-sm leading-6 text-muted-foreground">{children}</p>
		</div>
	);
}

function ProgressBar({ value }: { value: number }) {
	return (
		<div className="h-2 rounded-full bg-muted">
			<div className="h-2 rounded-full bg-primary" style={{ width: `${value}%` }} />
		</div>
	);
}

function Overview() {
	return (
		<div className="grid gap-5">
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Metric label="Retention" value="42 / 60" description="Points approved this term" icon={ClipboardCheck} />
				<Metric label="Survey" value="1" description="Random sample request" icon={MessageSquare} />
				<Metric label="Library" value="16" description="Saved items and lists" icon={Archive} />
				<Metric label="Links" value="184" description="Clicks from your short links" icon={Link2} />
			</div>

			<div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
				<Card className="border-primary/20 bg-primary text-primary-foreground">
					<CardHeader>
						<div className="flex items-center justify-between gap-3">
							<Badge variant="secondary">Action needed</Badge>
							<Button variant="secondary" size="sm">
								<MessageSquare />
								Answer survey
							</Button>
						</div>
						<CardTitle className="text-2xl">You were selected for Youth Huddle feedback.</CardTitle>
						<CardDescription className="text-primary-foreground/80">
							The survey sample is private to admins. The event forum stays open to every attendee.
						</CardDescription>
					</CardHeader>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Member record</CardTitle>
						<CardDescription>Sam Sami Dela Cruz</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex flex-wrap gap-2">
							<Badge variant="info">she/her</Badge>
							<Badge variant="success">Calendar admin</Badge>
							<Badge variant="outline">Member</Badge>
						</div>
						<Button variant="outline" className="w-full">
							<CircleUserRound />
							Edit profile
						</Button>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-5 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Today</CardTitle>
						<CardDescription>Important work, without making members hunt for it.</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3">
						{[
							["Scan event QR", "Open camera after sign in and record attendance."],
							["Upload proof", "Add photos, clips, and captions to Retention Night."],
							["Review library comments", "Two notes were added to your saved list."],
						].map(([title, text]) => (
							<div className="flex items-center justify-between gap-3 rounded-md border p-3" key={title}>
								<div>
									<p className="text-sm font-medium">{title}</p>
									<p className="text-xs text-muted-foreground">{text}</p>
								</div>
								<Button variant="ghost" size="icon" aria-label={`Open ${title}`}>
									<ChevronRight />
								</Button>
							</div>
						))}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Retention path</CardTitle>
						<CardDescription>Current progress toward active status.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<ProgressBar value={70} />
						<div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
							<span>Created</span>
							<span>Scanned</span>
							<span>Approved</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Library() {
	const [query, setQuery] = useState("");
	const [topic, setTopic] = useState("All topics");
	const filtered = useMemo(
		() =>
			resources.filter((resource) => {
				const matchesSearch = resource.title.toLowerCase().includes(query.toLowerCase());
				const matchesTopic = topic === "All topics" || resource.topic === topic;
				return matchesSearch && matchesTopic;
			}),
		[query, topic],
	);

	return (
		<div className="grid gap-5">
			<div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
				<div className="relative">
					<Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
					<Input className="pl-9" placeholder="Search cases, tags, comments" value={query} onChange={(event) => setQuery(event.target.value)} />
				</div>
				<Select value={topic} onChange={(event) => setTopic(event.target.value)}>
					<option>All topics</option>
					<option>Consulting</option>
					<option>Formation</option>
					<option>Retention</option>
				</Select>
				<Button variant="outline">
					<Sparkles />
					Graph search
				</Button>
			</div>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				{filtered.map((resource) => (
					<Card key={resource.title}>
						<CardHeader>
							<div className="flex items-center justify-between">
								<Badge variant={resource.access === "Confidential" ? "warn" : "success"}>{resource.access}</Badge>
								<Button variant="ghost" size="icon" aria-label={`Save ${resource.title}`}>
									<Heart />
								</Button>
							</div>
							<CardTitle>{resource.title}</CardTitle>
							<CardDescription>
								{resource.type} · {resource.topic}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">{resource.comments} member comments</p>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-5 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Saved lists</CardTitle>
						<CardDescription>Member-owned collections for repeated work.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<p>Consultant onboarding references · 14 items</p>
						<p>Facilitation methods for youth orgs · 8 items</p>
						<p>CRS planning examples · 5 items</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Comment policy</CardTitle>
						<CardDescription>Comments are visible to signed-in members by default.</CardDescription>
					</CardHeader>
					<CardContent>
						<Textarea defaultValue="Best reference for scoping stakeholder interviews." />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Links() {
	return (
		<div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
			<div className="space-y-5">
				<Card>
					<CardHeader>
						<CardTitle>Create redirect</CardTitle>
						<CardDescription>Members edit their own links. Admins can edit or delete any link with an audit note.</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
						<Input defaultValue="/youth-huddle-kit" aria-label="Custom slug" />
						<Input defaultValue="https://code.example/resources/youth-huddle-kit" aria-label="Destination URL" />
						<Button>
							<Link2 />
							Create
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Link directory</CardTitle>
						<CardDescription>Everyone can view statistics and ownership.</CardDescription>
					</CardHeader>
					<CardContent className="overflow-x-auto">
						<table className="w-full min-w-[640px] text-left text-sm">
							<thead className="text-xs uppercase text-muted-foreground">
								<tr className="border-b">
									<th className="py-3">Slug</th>
									<th>Destination</th>
									<th>Owner</th>
									<th>Clicks</th>
									<th>Permission</th>
								</tr>
							</thead>
							<tbody>
								{links.map((link) => (
									<tr className="border-b last:border-0" key={link.slug}>
										<td className="py-3 font-mono">{link.slug}</td>
										<td>{link.destination}</td>
										<td>{link.owner}</td>
										<td>{link.clicks}</td>
										<td>
											<Badge variant={link.status === "Own link" ? "success" : "outline"}>{link.status}</Badge>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>QR customizer</CardTitle>
					<CardDescription>Light, dark, and transparent exports with the CODE mark in the center.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid aspect-square place-items-center rounded-lg border bg-white p-6">
						<QrCode className="h-40 w-40 text-foreground" />
					</div>
					<div className="grid grid-cols-3 gap-2">
						<Button variant="outline" size="sm">Light</Button>
						<Button variant="quiet" size="sm">Dark</Button>
						<Button variant="quiet" size="sm">Clear</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function Crs() {
	const [participants, setParticipants] = useState(72);
	const sample = Math.max(12, Math.ceil(participants * 0.28));

	return (
		<div className="grid gap-5">
			<div className="grid gap-3 md:grid-cols-4">
				{[
					["Create", "Title, date, type, forum"],
					["Scan", "Signed-in QR attendance"],
					["Archive", "Photos, videos, captions"],
					["Approve", "Points and survey sample"],
				].map(([title, text], index) => (
					<div className="rounded-lg border bg-card p-4" key={title}>
						<div className="mb-3 flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">{index + 1}</div>
						<p className="font-medium">{title}</p>
						<p className="text-sm text-muted-foreground">{text}</p>
					</div>
				))}
			</div>

			<div className="grid gap-5 xl:grid-cols-[1fr_360px]">
				<Card>
					<CardHeader>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<CardTitle>Retention Night</CardTitle>
								<CardDescription>Awaiting admin approval</CardDescription>
							</div>
							<Badge variant="warn">Points pending</Badge>
						</div>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-3">
						<div className="rounded-md border p-4">
							<p className="text-2xl font-semibold">72</p>
							<p className="text-sm text-muted-foreground">Attendees scanned</p>
						</div>
						<div className="rounded-md border p-4">
							<p className="text-2xl font-semibold">38</p>
							<p className="text-sm text-muted-foreground">Archive uploads</p>
						</div>
						<div className="rounded-md border p-4">
							<p className="text-2xl font-semibold">11</p>
							<p className="text-sm text-muted-foreground">Forum threads</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Representative survey</CardTitle>
						<CardDescription>Admins select attendees. The forum remains open to all.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Input
							type="number"
							value={participants}
							onChange={(event) => setParticipants(Number(event.target.value))}
							aria-label="Participant count"
						/>
						<div className="rounded-md border p-3 text-sm">
							<strong>{sample} members</strong> should receive the post-event form.
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-5 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Attendance scanner</CardTitle>
						<CardDescription>Camera access starts only after sign in.</CardDescription>
					</CardHeader>
					<CardContent>
						<Button className="w-full">
							<Camera />
							Open scanner
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Archive proof</CardTitle>
						<CardDescription>Attendees can add media and captions for the event record.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Textarea defaultValue="Members shared reflections on what makes CODE feel supportive." />
						<Button variant="outline" className="w-full">
							<FileText />
							Add archive note
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Calendar() {
	return (
		<div className="grid gap-5 xl:grid-cols-[1fr_340px]">
			<Card>
				<CardHeader className="flex-row items-center justify-between space-y-0">
					<div>
						<CardTitle>June 2026</CardTitle>
						<CardDescription>Official, casual, birthday, and CRS dates.</CardDescription>
					</div>
					<Button variant="outline" size="sm">Add event</Button>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
						{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
							<div key={day}>{day}</div>
						))}
					</div>
					<div className="mt-2 grid grid-cols-7 gap-2">
						{Array.from({ length: 35 }, (_, index) => {
							const day = index + 1;
							const event = events.find((item) => Number(item.day) === day);
							return (
								<div className="min-h-20 rounded-md border bg-background p-2 text-xs" key={day}>
									<div className="font-medium">{day <= 30 ? day : day - 30}</div>
									{event ? <Badge className="mt-2 max-w-full truncate" variant={event.tone as "success"}>{event.title}</Badge> : null}
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>This week</CardTitle>
					<CardDescription>Filtered agenda for members.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{events.slice(0, 4).map((event) => (
						<div className="flex items-center justify-between gap-3 rounded-md border p-3" key={event.title}>
							<div>
								<p className="text-sm font-medium">{event.title}</p>
								<p className="text-xs text-muted-foreground">June {event.day}</p>
							</div>
							<Badge variant="outline">{event.type}</Badge>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

function Announcements() {
	return (
		<div className="grid gap-5 lg:grid-cols-[1fr_360px]">
			<div className="space-y-4">
				{[
					["CRS approval rules updated", "Retention office", "Proof notes now need one event outcome and one attendance summary."],
					["Private case library release", "Publishing team", "Four confidential case studies were added for member review."],
					["New official event template", "Calendar admin", "Official events can now create CRS attendance QR codes from the calendar."],
				].map(([title, owner, body]) => (
					<Card key={title}>
						<CardHeader>
							<div className="flex items-center justify-between gap-3">
								<CardTitle>{title}</CardTitle>
								<Badge variant="info">{owner}</Badge>
							</div>
							<CardDescription>{body}</CardDescription>
						</CardHeader>
					</Card>
				))}
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Publish draft</CardTitle>
					<CardDescription>Publishing admins can target, pin, and schedule notices.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Input defaultValue="Committee reminders" />
					<Select defaultValue="All members">
						<option>All members</option>
						<option>Admins only</option>
						<option>Selected committee</option>
					</Select>
					<Textarea defaultValue="Add the announcement body here." />
					<Button className="w-full">
						<Bell />
						Publish
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}

function Admin() {
	return (
		<div className="grid gap-5">
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
				<Metric label="CRS" value="7" description="Events need approval" icon={ClipboardCheck} />
				<Metric label="Links" value="3" description="Moderation requests" icon={Link2} />
				<Metric label="Publishing" value="5" description="Drafts waiting" icon={Bell} />
				<Metric label="Roles" value="2" description="Privilege changes" icon={KeyRound} />
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Admin queue</CardTitle>
					<CardDescription>Super admins inherit every scoped role. Sensitive actions keep an audit note.</CardDescription>
				</CardHeader>
				<CardContent className="overflow-x-auto">
					<table className="w-full min-w-[640px] text-left text-sm">
						<thead className="text-xs uppercase text-muted-foreground">
							<tr className="border-b">
								<th className="py-3">Item</th>
								<th>Role</th>
								<th>Status</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{adminQueue.map((queueItem) => (
								<tr className="border-b last:border-0" key={queueItem.item}>
									<td className="py-3">{queueItem.item}</td>
									<td>{queueItem.role}</td>
									<td>
										<Badge variant="warn">{queueItem.risk}</Badge>
									</td>
									<td>
										<Button variant="outline" size="sm">{queueItem.action}</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>
			<div className="grid gap-5 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Role assignment</CardTitle>
						<CardDescription>Members can hold more than one scoped admin role.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Input defaultValue="Sam Dela Cruz" />
						<Select defaultValue="Calendar admin">
							<option>Calendar admin</option>
							<option>Publishing admin</option>
							<option>Link admin</option>
							<option>CRS admin</option>
							<option>Super admin</option>
						</Select>
						<Button className="w-full">
							<UsersRound />
							Assign role
						</Button>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Audit log</CardTitle>
						<CardDescription>Recent privileged actions.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<p>Mika assigned Calendar admin to Sam Dela Cruz.</p>
						<p>Rafa approved General Assembly for 5 retention points.</p>
						<p>Publishing admin pinned the CRS proof notice.</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

const views: Record<ModuleId, React.ReactNode> = {
	overview: <Overview />,
	library: <Library />,
	links: <Links />,
	crs: <Crs />,
	calendar: <Calendar />,
	announcements: <Announcements />,
	admin: <Admin />,
};

export default function Home() {
	const [activeModule, setActiveModule] = useState<ModuleId>("overview");
	const active = modules.find((module) => module.id === activeModule) ?? modules[0];

	return (
		<main className="min-h-screen bg-background text-foreground">
			<div className="border-b border-[#3D5266] bg-primary text-primary-foreground">
				<div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
					<div className="flex items-center gap-3">
						<div
							className="h-10 w-28 bg-[url('/code-logo-full-white.png')] bg-contain bg-left bg-no-repeat"
							role="img"
							aria-label="CODE"
						/>
						<div>
							<p className="text-xs text-white/75">Member workspace</p>
						</div>
					</div>
					<div className="hidden min-w-72 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 md:flex">
						<Search className="h-4 w-4 text-white/75" />
						<span className="text-sm text-white/75">Search events, resources, links</span>
					</div>
					<div className="flex items-center gap-2">
						<Button className="text-white hover:bg-white/10 hover:text-white" variant="ghost" size="sm">Replay tour</Button>
						<Button className="border-white/35 bg-transparent text-white hover:bg-white/10 hover:text-white" variant="outline" size="sm">
							<CircleUserRound />
							<span className="hidden sm:inline">Sam</span>
						</Button>
					</div>
				</div>
			</div>

			<div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[250px_1fr] lg:px-8">
				<aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
					<nav className="grid gap-2" aria-label="Workspace modules">
						{modules.map((module) => {
							const Icon = module.icon;
							return (
								<Button
									className="justify-start"
									key={module.id}
									variant={activeModule === module.id ? "default" : "ghost"}
									onClick={() => setActiveModule(module.id)}
								>
									<Icon />
									{module.label}
								</Button>
							);
						})}
					</nav>
					<Card className="mt-5 hidden lg:block">
						<CardHeader>
							<CardTitle>First-time help</CardTitle>
							<CardDescription>Guided tours can be replayed for member and admin tools.</CardDescription>
						</CardHeader>
						<CardContent>
							<Button variant="outline" className="w-full">
								<Sparkles />
								Start tour
							</Button>
						</CardContent>
					</Card>
				</aside>

				<section className="min-w-0">
					<div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
						<SectionTitle kicker="Signed-in workspace" title={active.label}>
							A calmer member hub for profile details, private knowledge, CODE redirects, retention events, calendars,
							announcements, and scoped admin work.
						</SectionTitle>
						<TabsList className="w-full overflow-x-auto lg:hidden">
							{modules.map((module) => (
								<TabButton key={module.id} active={activeModule === module.id} onClick={() => setActiveModule(module.id)}>
									{module.label}
								</TabButton>
							))}
						</TabsList>
					</div>
					{views[activeModule]}
				</section>
			</div>
		</main>
	);
}
