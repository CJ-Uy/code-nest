"use client";

import { FormEvent, MouseEvent, useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ArrowDown, ArrowUp, ChevronsUpDown, Copy, ExternalLink, ImageUp, Info, Plus, QrCode, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import type { LinkListItem, LinkStats, QrStyle } from "@/db/repositories/links";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ClicksOverTime, DonutChart, formatBucket } from "./charts";
import { LinkQrCustomizer } from "./link-qr-customizer";
import { shortLinkUrl } from "./urls";

type LinkView = Omit<LinkListItem, "createdAt" | "updatedAt"> & { createdAt: Date | string; updatedAt: Date | string };
type StatsView = Omit<LinkStats, "link"> & { link: LinkView };
type ViewMode = "all" | "mine";
type SortKey = "title" | "slug" | "clicks" | "owner" | "created";
type SortState = { key: SortKey; dir: "asc" | "desc" };

type LinksWorkspaceProps = {
	initialLinks: LinkView[];
	actorMemberId: string;
	canModerate: boolean;
};

export function LinksWorkspace({ initialLinks, actorMemberId, canModerate }: LinksWorkspaceProps) {
	const [links, setLinks] = useState(initialLinks);
	const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));
	const [status, setStatus] = useState("");
	const [view, setView] = useState<ViewMode>("all");
	const [search, setSearch] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [sort, setSort] = useState<SortState>({ key: "created", dir: "desc" });
	const [createOpen, setCreateOpen] = useState(false);
	const [activeId, setActiveId] = useState("");
	const [stats, setStats] = useState<StatsView | null>(null);
	const [statsLoading, setStatsLoading] = useState(false);
	const [form, setForm] = useState({ slug: "", destinationUrl: "", title: "", tags: [] as string[] });

	const baseLabel = origin ? origin.replace(/^https?:\/\//, "") : "your-code-site";
	const tagOptions = useMemo(() => Array.from(new Set(links.flatMap((link) => link.tags))).sort(), [links]);
	const active = useMemo(() => links.find((link) => link.id === activeId) ?? null, [activeId, links]);
	const activeUrl = active && origin ? shortLinkUrl(origin, active.slug) : "";

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		return links.filter((link) => {
			if (view === "mine" && link.ownerMemberId !== actorMemberId) return false;
			if (selectedTags.length && !selectedTags.some((tag) => link.tags.includes(tag))) return false;
			if (!term) return true;
			return [link.title, link.slug, link.destinationUrl].some((value) => value.toLowerCase().includes(term));
		});
	}, [actorMemberId, links, search, selectedTags, view]);

	const sorted = useMemo(() => {
		const dir = sort.dir === "asc" ? 1 : -1;
		return [...filtered].sort((a, b) => {
			switch (sort.key) {
				case "clicks":
					return (a.clickCount - b.clickCount) * dir;
				case "created":
					return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
				case "owner":
					return (a.owner?.name ?? "￿").localeCompare(b.owner?.name ?? "￿") * dir;
				case "slug":
					return a.slug.localeCompare(b.slug) * dir;
				default:
					return a.title.localeCompare(b.title) * dir;
			}
		});
	}, [filtered, sort]);

	function toggleSort(key: SortKey) {
		setSort((current) =>
			current.key === key
				? { key, dir: current.dir === "asc" ? "desc" : "asc" }
				: { key, dir: key === "created" || key === "clicks" ? "desc" : "asc" },
		);
	}

	async function refresh() {
		const response = await fetch("/api/links", { credentials: "same-origin" });
		const body = await response.json() as { links?: LinkView[]; error?: string };
		if (!response.ok || !body.links) {
			setStatus(body.error ?? "Could not refresh links.");
			return;
		}
		setLinks(body.links);
		setStatus("Links refreshed.");
	}

	async function createLink(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const response = await fetch("/api/links", {
			method: "POST",
			credentials: "same-origin",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(form),
		});
		const body = await response.json() as { link?: LinkView; error?: string };
		if (!response.ok || !body.link) {
			setStatus(body.error ?? "Could not create link.");
			return;
		}
		setLinks((current) => [body.link!, ...current]);
		setForm({ slug: "", destinationUrl: "", title: "", tags: [] });
		setCreateOpen(false);
		setStatus("Link created.");
		openDialog(body.link.id);
	}

	async function updateLink(id: string, patch: Partial<LinkView>) {
		const response = await fetch(`/api/links/${encodeURIComponent(id)}`, {
			method: "PATCH",
			credentials: "same-origin",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(patch),
		});
		const body = await response.json() as { link?: LinkView; error?: string };
		if (!response.ok || !body.link) {
			setStatus(body.error ?? "Could not save link.");
			return;
		}
		setLinks((current) => current.map((link) => (link.id === body.link!.id ? body.link! : link)));
		setStatus("Link saved.");
	}

	async function removeLink(event: MouseEvent, id: string) {
		event.stopPropagation();
		const response = await fetch(`/api/links/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
		if (!response.ok) {
			setStatus("Could not delete link.");
			return;
		}
		setLinks((current) => current.filter((link) => link.id !== id));
		if (activeId === id) setActiveId("");
		setStatus("Link deleted.");
	}

	async function openDialog(id: string) {
		setActiveId(id);
		setStats(null);
		setStatsLoading(true);
		const response = await fetch(`/api/links/${encodeURIComponent(id)}/stats`, { credentials: "same-origin" });
		if (!response.ok) {
			setStatsLoading(false);
			setStatus("Could not load stats.");
			return;
		}
		setStats(await response.json() as StatsView);
		setStatsLoading(false);
	}

	function copy(event: MouseEvent, link: LinkView) {
		event.stopPropagation();
		if (!origin) return;
		navigator.clipboard.writeText(shortLinkUrl(origin, link.slug));
		setStatus("Link copied.");
	}

	function canEdit(link: LinkView): boolean {
		return canModerate || link.ownerMemberId === actorMemberId;
	}

	return (
		<div className="grid gap-5">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<p className="text-xs font-semibold uppercase text-primary">Short links</p>
					<h1 className="font-heading text-3xl">Links</h1>
					<p className="mt-1 max-w-xl text-sm text-muted-foreground">Turn long web addresses into tidy <span className="font-medium text-foreground">{baseLabel}/name</span> links, share them, and see how many people click.</p>
				</div>
				<div className="flex items-center gap-2">
					{canModerate ? <Badge variant="info">Moderator</Badge> : null}
					<Button variant="outline" size="sm" onClick={refresh}>
						<RefreshCw />
						Refresh
					</Button>
					<CreateLinkDialog
						open={createOpen}
						onOpenChange={setCreateOpen}
						form={form}
						setForm={setForm}
						onSubmit={createLink}
						tagOptions={tagOptions}
						baseLabel={baseLabel}
					/>
				</div>
			</div>

			<details className="group rounded-lg border bg-card p-4 text-sm">
				<summary className="flex cursor-pointer items-center gap-2 font-semibold text-foreground">
					<Info className="size-4 text-primary" />
					New here? What these words mean
				</summary>
				<div className="mt-3 grid max-w-3xl gap-2 text-muted-foreground">
					<p><strong className="text-foreground">Short link</strong> — a tidy CODE web address that forwards to a longer one. Share <UrlToken>{`${baseLabel}/welcome`}</UrlToken> instead of a giant URL.</p>
					<p><strong className="text-foreground">Slug</strong> — the custom ending you choose, the part after the slash. In <UrlToken>{`${baseLabel}/welcome`}</UrlToken> the slug is <strong className="text-foreground">welcome</strong>. Use letters, numbers, and dashes.</p>
					<p><strong className="text-foreground">Destination</strong> — where people actually land when they open the link.</p>
					<p><strong className="text-foreground">Clicks</strong> — every time someone opens your link we count it, so you can see what&rsquo;s getting attention. Open any link for a day-by-day breakdown and its QR code.</p>
				</div>
			</details>

			<div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
				<div className="flex rounded-md border bg-background p-1">
					{(["all", "mine"] as ViewMode[]).map((mode) => (
						<button key={mode} type="button" onClick={() => setView(mode)} className={view === mode ? "rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground" : "px-3 py-1.5 text-xs font-semibold text-muted-foreground"}>
							{mode === "mine" ? "My links" : "All links"}
						</button>
					))}
				</div>
				<label className="relative min-w-56 flex-1">
					<span className="sr-only">Search links</span>
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title, slug, or destination" className="pl-9" />
				</label>
				{tagOptions.length ? (
					<div className="flex flex-wrap items-center gap-1">
						<span className="mr-1 text-xs text-muted-foreground">Tags:</span>
						{tagOptions.map((tag) => (
							<button key={tag} type="button" onClick={() => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} className={selectedTags.includes(tag) ? "rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground" : "rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground"}>
								{tag}
							</button>
						))}
						{selectedTags.length ? <button type="button" onClick={() => setSelectedTags([])} className="px-1 text-xs text-muted-foreground underline">clear</button> : null}
					</div>
				) : null}
			</div>

			{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

			<MobileLinksList links={sorted} baseLabel={baseLabel} onOpen={openDialog} />

			<div className="hidden min-w-0 rounded-lg border bg-card md:block">
				<Table className="table-fixed">
					<TableHeader>
						<TableRow>
							<SortHeader label="Title" column="title" sort={sort} onSort={toggleSort} className="w-[26%]" />
							<SortHeader label="Short link" column="slug" sort={sort} onSort={toggleSort} className="w-[18%]" />
							<TableHead className="hidden w-[8%] lg:table-cell">Tags</TableHead>
							<SortHeader label="Clicks" column="clicks" sort={sort} onSort={toggleSort} align="right" className="w-[7%]" />
							<SortHeader label="Owner" column="owner" sort={sort} onSort={toggleSort} className="w-[17%]" />
							<SortHeader label="Created" column="created" sort={sort} onSort={toggleSort} className="hidden w-[10%] lg:table-cell" />
							<TableHead className="w-[120px] text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sorted.map((link) => (
							<TableRow key={link.id} className="cursor-pointer" onClick={() => openDialog(link.id)}>
								<TableCell><p className="truncate font-medium">{link.title}</p><p className="truncate text-xs text-muted-foreground">to {link.destinationUrl}</p></TableCell>
								<TableCell><ShortLinkCell origin={origin} baseLabel={baseLabel} slug={link.slug} /></TableCell>
								<TableCell className="hidden lg:table-cell"><TagList tags={link.tags} /></TableCell>
								<TableCell className="text-right tabular-nums">{link.clickCount}</TableCell>
								<TableCell><Owner owner={link.owner} /></TableCell>
								<TableCell className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{new Date(link.createdAt).toLocaleDateString()}</TableCell>
								<TableCell>
									<div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
										<Button variant="outline" size="icon" aria-label="Copy link" onClick={(event) => copy(event, link)}><Copy /></Button>
										<Button variant="outline" size="icon" aria-label="View details and QR code" onClick={(event) => { event.stopPropagation(); void openDialog(link.id); }}><QrCode /></Button>
										{canEdit(link) ? <Button variant="ghost" size="icon" aria-label="Delete link" onClick={(event) => removeLink(event, link.id)}><Trash2 /></Button> : null}
									</div>
								</TableCell>
							</TableRow>
						))}
						{!sorted.length ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">{links.length ? "No links match these filters." : "No short links yet. Create your first one to get started."}</TableCell></TableRow> : null}
					</TableBody>
				</Table>
			</div>

			<DialogPrimitive.Root open={Boolean(active)} onOpenChange={(open) => !open && setActiveId("")}>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/45" />
					<DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[min(100%-1.5rem,980px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-5 shadow-lg">
						{active ? <LinkDialog link={active} url={activeUrl} baseLabel={baseLabel} stats={stats} loading={statsLoading} editable={canEdit(active)} onSave={(patch) => updateLink(active.id, patch)} onUpload={(file) => uploadPreview(active.id, file, updateLink, setStatus)} /> : null}
						<DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="size-4" /><span className="sr-only">Close</span></DialogPrimitive.Close>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</div>
	);
}

function MobileLinksList({ links, baseLabel, onOpen }: { links: LinkView[]; baseLabel: string; onOpen(id: string): void }) {
	return (
		<div className="overflow-hidden rounded-lg border bg-card md:hidden">
			{links.map((link) => (
				<button key={link.id} type="button" onClick={() => onOpen(link.id)} className="grid w-full gap-1 border-b p-4 text-left last:border-b-0 active:bg-secondary">
					<span className="truncate font-medium text-foreground">{link.title}</span>
					<span className="truncate text-sm text-primary">{baseLabel}/{link.slug}</span>
				</button>
			))}
			{!links.length ? <p className="p-6 text-center text-sm text-muted-foreground">No links match these filters.</p> : null}
		</div>
	);
}

function UrlToken({ children }: { children: string }) {
	return <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">{children}</span>;
}

function SortHeader({ label, column, sort, onSort, align = "left", className }: { label: string; column: SortKey; sort: SortState; onSort(key: SortKey): void; align?: "left" | "right"; className?: string }) {
	const activeSort = sort.key === column;
	const Icon = !activeSort ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
	return (
		<TableHead className={cn(align === "right" && "text-right", className)}>
			<button type="button" onClick={() => onSort(column)} className={cn("inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground", activeSort ? "text-foreground" : "text-muted-foreground", align === "right" && "flex-row-reverse")}>
				{label}
				<Icon className={cn("size-3.5", activeSort ? "opacity-100" : "opacity-40")} />
			</button>
		</TableHead>
	);
}

function ShortLinkCell({ origin, baseLabel, slug }: { origin: string; baseLabel: string; slug: string }) {
	const href = origin ? shortLinkUrl(origin, slug) : `/${slug}`;
	return (
		<a href={href} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex max-w-full items-center gap-1 font-medium text-primary hover:underline">
			<span className="truncate">{baseLabel}/{slug}</span>
			<ExternalLink className="size-3.5 shrink-0 opacity-60" />
		</a>
	);
}

function Owner({ owner }: { owner: LinkView["owner"] }) {
	if (!owner) return <span className="text-muted-foreground">—</span>;
	return <span className="flex items-center gap-2"><Avatar image={owner.image} name={owner.name} size="sm" /><span className="max-w-32 truncate">{owner.name ?? "Member"}</span></span>;
}

function TagList({ tags }: { tags: string[] }) {
	if (!tags.length) return <span className="text-muted-foreground">—</span>;
	return <span className="flex flex-wrap gap-1">{tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</span>;
}

function CreateLinkDialog({ open, onOpenChange, form, setForm, onSubmit, tagOptions, baseLabel }: {
	open: boolean;
	onOpenChange(open: boolean): void;
	form: { slug: string; destinationUrl: string; title: string; tags: string[] };
	setForm(form: { slug: string; destinationUrl: string; title: string; tags: string[] }): void;
	onSubmit(event: FormEvent<HTMLFormElement>): void;
	tagOptions: string[];
	baseLabel: string;
}) {
	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DialogPrimitive.Trigger asChild>
				<Button size="sm"><Plus />New short link</Button>
			</DialogPrimitive.Trigger>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/45" />
				<DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[min(100%-1.5rem,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-6 shadow-lg">
					<DialogPrimitive.Title className="font-heading text-2xl">New short link</DialogPrimitive.Title>
					<DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">Point a memorable CODE address at any web page.</DialogPrimitive.Description>
					<form className="mt-4 grid gap-4" onSubmit={onSubmit}>
						<label className="grid gap-1 text-sm font-medium">
							Custom ending (slug)
							<div className="flex items-center rounded-md border border-input focus-within:ring-1 focus-within:ring-ring">
								<span className="whitespace-nowrap border-r border-input px-2 py-2 text-sm text-muted-foreground">{baseLabel}/</span>
								<Input value={form.slug} placeholder="welcome" onChange={(event) => setForm({ ...form, slug: event.target.value })} required className="border-0 shadow-none focus-visible:ring-0" />
							</div>
							<span className="text-xs font-normal text-muted-foreground">No need to type a slash — just the custom ending. Your link will be <span className="font-medium text-foreground">{baseLabel}/{form.slug || "your-slug"}</span></span>
						</label>
						<label className="grid gap-1 text-sm font-medium">
							Destination
							<Input value={form.destinationUrl} placeholder="https://example.com" onChange={(event) => setForm({ ...form, destinationUrl: event.target.value })} required />
							<span className="text-xs font-normal text-muted-foreground">Where people go when they open the short link.</span>
						</label>
						<label className="grid gap-1 text-sm font-medium">
							Title
							<Input value={form.title} placeholder="Welcome page" onChange={(event) => setForm({ ...form, title: event.target.value })} required />
							<span className="text-xs font-normal text-muted-foreground">A name so you can recognise this link in the list.</span>
						</label>
						<TagInput value={form.tags} suggestions={tagOptions} onChange={(tags) => setForm({ ...form, tags })} hint="Optional labels to group links, e.g. event, social." />
						<div className="flex justify-end gap-2 pt-2">
							<DialogPrimitive.Close asChild>
								<Button type="button" variant="outline">Cancel</Button>
							</DialogPrimitive.Close>
							<Button type="submit"><Save />Create link</Button>
						</div>
					</form>
					<DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="size-4" /><span className="sr-only">Close</span></DialogPrimitive.Close>
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}

function TagInput({ value, suggestions, onChange, hint }: { value: string[]; suggestions: string[]; onChange(tags: string[]): void; hint?: string }) {
	const [draft, setDraft] = useState("");
	function add(tag = draft) {
		const next = tag.trim();
		if (!next) return;
		onChange(Array.from(new Set([...value, next])).slice(0, 10));
		setDraft("");
	}
	return (
		<label className="grid gap-1 text-sm font-medium">
			Tags
			<div className="flex min-h-10 flex-wrap items-center gap-1 rounded-md border border-input px-2 py-1">
				{value.map((tag) => <button key={tag} type="button" className="rounded bg-secondary px-2 py-1 text-xs" onClick={() => onChange(value.filter((item) => item !== tag))}>{tag} ×</button>)}
				<input list="link-tag-options" value={draft} placeholder={value.length ? "" : "Type a tag, press Enter"} onChange={(event) => setDraft(event.target.value)} onBlur={() => add()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add(); } }} className="min-w-20 flex-1 bg-transparent text-sm outline-none" />
				<datalist id="link-tag-options">{suggestions.map((tag) => <option key={tag} value={tag} />)}</datalist>
			</div>
			{hint ? <span className="text-xs font-normal text-muted-foreground">{hint}</span> : null}
		</label>
	);
}

function LinkDialog({ link, url, baseLabel, stats, loading, editable, onSave, onUpload }: { link: LinkView; url: string; baseLabel: string; stats: StatsView | null; loading: boolean; editable: boolean; onSave(patch: Partial<LinkView>): void; onUpload(file: File): void }) {
	const [tab, setTab] = useState<"details" | "stats">("details");
	return (
		<div className="grid gap-4">
			<div className="grid gap-1 pr-10">
				<DialogPrimitive.Title className="font-heading text-2xl">{link.title}</DialogPrimitive.Title>
				<DialogPrimitive.Description className="break-all text-sm text-muted-foreground">
					<a href={url || `/${link.slug}`} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{baseLabel}/{link.slug}</a>
					{" "}forwards to {link.destinationUrl}
				</DialogPrimitive.Description>
			</div>

			<div role="tablist" aria-label="Link sections" className="flex gap-1 border-b border-border">
				{([["details", "Details"], ["stats", "Statistics"]] as const).map(([id, label]) => (
					<button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors", tab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
						{label}
					</button>
				))}
			</div>

			{tab === "details" ? (
				<div className={cn("grid gap-4", editable && "lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]")}>
					<section className="grid content-start gap-3 rounded-lg border p-4">
						<h2 className="font-semibold">QR code</h2>
						<p className="text-sm text-muted-foreground">Print it, project it, or download it — anyone who scans it lands on your short link.</p>
						{url ? <LinkQrCustomizer url={url} style={link.qrStyle} editable={editable} linkId={link.id} onSave={(qrStyle: QrStyle) => onSave({ qrStyle } as Partial<LinkView>)} /> : null}
					</section>
					{editable ? <EditPanel link={link} onSave={onSave} onUpload={onUpload} /> : null}
				</div>
			) : (
				loading ? <p className="text-sm text-muted-foreground">Loading stats…</p> : <StatsBlock stats={stats} />
			)}
		</div>
	);
}

function StatsBlock({ stats }: { stats: StatsView | null }) {
	if (!stats) return <p className="text-sm text-muted-foreground">Could not load stats.</p>;
	const total = stats.series.reduce((sum, row) => sum + row.count, 0);
	const topSource = [...stats.referrers].sort((a, b) => b.count - a.count)[0]?.bucket;
	const topDevice = [...stats.devices].sort((a, b) => b.count - a.count)[0]?.bucket;
	const sourceData = stats.referrers.map((row) => ({ ...row, bucket: formatBucket(row.bucket) }));
	const deviceData = stats.devices.map((row) => ({ ...row, bucket: formatBucket(row.bucket) }));
	return (
		<section className="grid gap-4">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Stat label="Total clicks" value={String(total)} />
				<Stat label="Days tracked" value={String(stats.series.length)} />
				<Stat label="Top source" value={topSource ? formatBucket(topSource) : "None"} />
				<Stat label="Top device" value={topDevice ? formatBucket(topDevice) : "None"} />
			</div>
			<div className="rounded-lg border p-4"><h2 className="mb-3 font-semibold">Clicks over time</h2><ClicksOverTime data={stats.series} /></div>
			<div className="grid gap-4 sm:grid-cols-2">
				<div className="rounded-lg border p-4"><h2 className="mb-3 font-semibold">How people arrived</h2><DonutChart data={sourceData} label="Traffic source" /></div>
				<div className="rounded-lg border p-4"><h2 className="mb-3 font-semibold">Devices used</h2><DonutChart data={deviceData} label="Devices" /></div>
			</div>
		</section>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate font-semibold">{value}</p></div>;
}

function EditPanel({ link, onSave, onUpload }: { link: LinkView; onSave(patch: Partial<LinkView>): void; onUpload(file: File): void }) {
	const [title, setTitle] = useState(link.title);
	const [destinationUrl, setDestinationUrl] = useState(link.destinationUrl);
	const [previewTitle, setPreviewTitle] = useState(link.previewTitle ?? "");
	const [previewDescription, setPreviewDescription] = useState(link.previewDescription ?? "");
	const [tags, setTags] = useState(link.tags);
	return (
		<section className="grid content-start gap-3 rounded-lg border p-4">
			<h2 className="font-semibold">Edit link</h2>
			<label className="grid gap-1 text-sm font-medium">Title<Input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
			<label className="grid gap-1 text-sm font-medium">Destination<Input value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} /></label>
			<TagInput value={tags} suggestions={link.tags} onChange={setTags} />

			<details className="rounded-md border p-3 text-sm">
				<summary className="cursor-pointer font-medium">Social preview <span className="font-normal text-muted-foreground">(optional)</span></summary>
				<p className="mt-1 text-xs text-muted-foreground">When someone shares this link on chat or social media, it can show a little preview card. These fields control what that card says. Leave them blank to use the destination page&rsquo;s own preview.</p>
				<div className="mt-3 grid gap-3">
					<label className="grid gap-1 font-medium">Preview title<Input value={previewTitle} onChange={(event) => setPreviewTitle(event.target.value)} /><span className="text-xs font-normal text-muted-foreground">The headline shown on the card.</span></label>
					<label className="grid gap-1 font-medium">Preview description<Textarea value={previewDescription} onChange={(event) => setPreviewDescription(event.target.value)} /><span className="text-xs font-normal text-muted-foreground">A line or two under the headline.</span></label>
					<div className="grid gap-1">
						<span className="font-medium">Preview image</span>
						<Button asChild variant="outline" size="sm" className="w-fit"><label className="cursor-pointer"><ImageUp />Upload image<input className="sr-only" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} /></label></Button>
						<span className="text-xs font-normal text-muted-foreground">The thumbnail on the card. {link.previewImageKey ? "An image is set — uploading replaces it." : "No image yet."} Saved as soon as it uploads.</span>
					</div>
				</div>
			</details>

			<Button className="w-fit" onClick={() => onSave({ title, destinationUrl, tags, previewTitle: previewTitle || null, previewDescription: previewDescription || null })}><Save />Save changes</Button>
		</section>
	);
}

async function uploadPreview(id: string, file: File, updateLink: (id: string, patch: Partial<LinkView>) => Promise<void>, setStatus: (status: string) => void) {
	const body = new FormData();
	body.set("purpose", "link_preview");
	body.set("linkId", id);
	body.set("file", file);
	const response = await fetch("/api/uploads", { method: "POST", credentials: "same-origin", body });
	const result = await response.json() as { key?: string; error?: string };
	if (!response.ok || !result.key) {
		setStatus(result.error ?? "Could not upload image.");
		return;
	}
	await updateLink(id, { previewImageKey: result.key });
}
