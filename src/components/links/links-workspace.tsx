"use client";

import { FormEvent, MouseEvent, useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Copy, ExternalLink, ImageUp, QrCode, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import type { LinkListItem, LinkStats, QrStyle } from "@/db/repositories/links";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ClicksOverTime, BucketBars } from "./charts";
import { LinkQrCustomizer } from "./link-qr-customizer";
import { shortLinkUrl } from "./urls";

type LinkView = Omit<LinkListItem, "createdAt" | "updatedAt"> & { createdAt: Date | string; updatedAt: Date | string };
type StatsView = Omit<LinkStats, "link"> & { link: LinkView };
type ViewMode = "all" | "mine" | "clicked";

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
	const [activeId, setActiveId] = useState("");
	const [stats, setStats] = useState<StatsView | null>(null);
	const [statsLoading, setStatsLoading] = useState(false);
	const [form, setForm] = useState({ slug: "", destinationUrl: "", title: "", tags: [] as string[] });


	const tagOptions = useMemo(() => Array.from(new Set(links.flatMap((link) => link.tags))).sort(), [links]);
	const active = useMemo(() => links.find((link) => link.id === activeId) ?? null, [activeId, links]);
	const activeUrl = active && origin ? shortLinkUrl(origin, active.slug) : "";
	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase();
		const base = links.filter((link) => {
			if (view === "mine" && link.ownerMemberId !== actorMemberId) return false;
			if (selectedTags.length && !selectedTags.some((tag) => link.tags.includes(tag))) return false;
			if (!term) return true;
			return [link.title, link.slug, link.destinationUrl].some((value) => value.toLowerCase().includes(term));
		});
		return view === "clicked" ? [...base].sort((a, b) => b.clickCount - a.clickCount) : base;
	}, [actorMemberId, links, search, selectedTags, view]);

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
				</div>
				<div className="flex items-center gap-2">
					{canModerate ? <Badge variant="info">Moderator</Badge> : null}
					<Button variant="outline" size="sm" onClick={refresh}>
						<RefreshCw />
						Refresh
					</Button>
				</div>
			</div>

			<details className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
				<summary className="cursor-pointer font-semibold text-foreground">How short links work</summary>
				<p className="mt-2 max-w-3xl">A short link is a CODE URL like <strong className="text-foreground">/welcome</strong>. It redirects to the destination and records click totals by day, referrer, and device.</p>
			</details>

			<form className="grid gap-3 rounded-lg border bg-card p-4 lg:grid-cols-[1fr_2fr_1fr_1fr_auto]" onSubmit={createLink}>
				<label className="grid gap-1 text-sm font-medium">
					Slug
					<Input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
				</label>
				<label className="grid gap-1 text-sm font-medium">
					Destination
					<Input value={form.destinationUrl} onChange={(event) => setForm({ ...form, destinationUrl: event.target.value })} required />
				</label>
				<label className="grid gap-1 text-sm font-medium">
					Title
					<Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
				</label>
				<TagInput value={form.tags} suggestions={tagOptions} onChange={(tags) => setForm({ ...form, tags })} />
				<Button type="submit" className="self-end">
					<Save />
					Create
				</Button>
			</form>

			<div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
				<div className="flex rounded-md border bg-background p-1">
					{(["all", "mine", "clicked"] as ViewMode[]).map((mode) => (
						<button key={mode} type="button" onClick={() => setView(mode)} className={view === mode ? "rounded bg-primary px-3 py-1.5 text-xs font-semibold text-white" : "px-3 py-1.5 text-xs font-semibold text-muted-foreground"}>
							{mode === "clicked" ? "Most clicked" : mode === "mine" ? "Mine" : "All"}
						</button>
					))}
				</div>
				<label className="relative min-w-56 flex-1">
					<span className="sr-only">Search links</span>
					<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, slug, or destination" className="pl-9" />
				</label>
				<div className="flex flex-wrap gap-1">
					{tagOptions.map((tag) => (
						<button key={tag} type="button" onClick={() => setSelectedTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} className={selectedTags.includes(tag) ? "rounded-md bg-primary px-2 py-1 text-xs font-semibold text-white" : "rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground"}>
							{tag}
						</button>
					))}
				</div>
			</div>

			{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

			<div className="rounded-lg border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Owner</TableHead>
							<TableHead>Title</TableHead>
							<TableHead>Short link</TableHead>
							<TableHead>Tags</TableHead>
							<TableHead className="text-right">Clicks</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filtered.map((link) => (
							<TableRow key={link.id} className="cursor-pointer" onClick={() => openDialog(link.id)}>
								<TableCell><Owner owner={link.owner} /></TableCell>
								<TableCell className="min-w-48"><p className="font-medium">{link.title}</p><p className="truncate text-xs text-muted-foreground">{link.destinationUrl}</p></TableCell>
								<TableCell className="font-medium">/{link.slug}</TableCell>
								<TableCell><TagList tags={link.tags} /></TableCell>
								<TableCell className="text-right tabular-nums">{link.clickCount}</TableCell>
								<TableCell className="text-muted-foreground">{new Date(link.createdAt).toLocaleDateString()}</TableCell>
								<TableCell>
									<div className="flex justify-end gap-1">
										<Button variant="outline" size="icon" aria-label="Copy link" onClick={(event) => copy(event, link)}><Copy /></Button>
										<Button asChild variant="outline" size="icon" aria-label="Open short link" onClick={(event) => event.stopPropagation()}><a href={`/${link.slug}`} target="_blank" rel="noreferrer"><ExternalLink /></a></Button>
										<Button variant="outline" size="icon" aria-label="Show QR code" onClick={(event) => { event.stopPropagation(); void openDialog(link.id); }}><QrCode /></Button>
										{canEdit(link) ? <Button variant="ghost" size="icon" aria-label="Delete link" onClick={(event) => removeLink(event, link.id)}><Trash2 /></Button> : null}
									</div>
								</TableCell>
							</TableRow>
						))}
						{!filtered.length ? <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No links match these filters.</TableCell></TableRow> : null}
					</TableBody>
				</Table>
			</div>

			<DialogPrimitive.Root open={Boolean(active)} onOpenChange={(open) => !open && setActiveId("")}>
				<DialogPrimitive.Portal>
					<DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/45" />
					<DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[min(100%-1.5rem,980px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border bg-background p-5 shadow-lg">
						{active ? <LinkDialog link={active} url={activeUrl} stats={stats} loading={statsLoading} editable={canEdit(active)} onSave={(patch) => updateLink(active.id, patch)} onUpload={(file) => uploadPreview(active.id, file, updateLink, setStatus)} /> : null}
						<DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="size-4" /><span className="sr-only">Close</span></DialogPrimitive.Close>
					</DialogPrimitive.Content>
				</DialogPrimitive.Portal>
			</DialogPrimitive.Root>
		</div>
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

function TagInput({ value, suggestions, onChange }: { value: string[]; suggestions: string[]; onChange(tags: string[]): void }) {
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
				{value.map((tag) => <button key={tag} type="button" className="rounded bg-secondary px-2 py-1 text-xs" onClick={() => onChange(value.filter((item) => item !== tag))}>{tag}</button>)}
				<input list="link-tag-options" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => add()} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); add(); } }} className="min-w-20 flex-1 bg-transparent text-sm outline-none" />
				<datalist id="link-tag-options">{suggestions.map((tag) => <option key={tag} value={tag} />)}</datalist>
			</div>
		</label>
	);
}

function LinkDialog({ link, url, stats, loading, editable, onSave, onUpload }: { link: LinkView; url: string; stats: StatsView | null; loading: boolean; editable: boolean; onSave(patch: Partial<LinkView>): void; onUpload(file: File): void }) {
	return (
		<div className="grid gap-5">
			<DialogPrimitive.Title className="pr-10 font-heading text-2xl">{link.title}</DialogPrimitive.Title>
			<DialogPrimitive.Description className="break-all text-sm text-muted-foreground">/{link.slug} to {link.destinationUrl}</DialogPrimitive.Description>
			{loading ? <p className="text-sm text-muted-foreground">Loading stats.</p> : <StatsBlock stats={stats} />}
			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
				<section className="grid gap-3 rounded-lg border p-4">
					<h2 className="font-semibold">QR code</h2>
					{url ? <LinkQrCustomizer url={url} style={link.qrStyle} editable={editable} onSave={(qrStyle: QrStyle) => onSave({ qrStyle } as Partial<LinkView>)} /> : null}
				</section>
				{editable ? <EditPanel link={link} onSave={onSave} onUpload={onUpload} /> : null}
			</div>
		</div>
	);
}

function StatsBlock({ stats }: { stats: StatsView | null }) {
	if (!stats) return <p className="text-sm text-muted-foreground">Could not load stats.</p>;
	const total = stats.series.reduce((sum, row) => sum + row.count, 0);
	const topReferrer = [...stats.referrers].sort((a, b) => b.count - a.count)[0]?.bucket ?? "None";
	const topDevice = [...stats.devices].sort((a, b) => b.count - a.count)[0]?.bucket ?? "None";
	return (
		<section className="grid gap-4">
			<div className="grid gap-3 sm:grid-cols-4">
				<Stat label="Total clicks" value={String(total)} />
				<Stat label="Days tracked" value={String(stats.series.length)} />
				<Stat label="Top referrer" value={topReferrer} />
				<Stat label="Top device" value={topDevice} />
			</div>
			<div className="grid gap-4 lg:grid-cols-2">
				<div className="rounded-lg border p-4"><h2 className="mb-3 font-semibold">Clicks over time</h2><ClicksOverTime data={stats.series} /></div>
				<div className="grid gap-4"><div className="rounded-lg border p-4"><h2 className="mb-3 font-semibold">Referrers</h2><BucketBars data={stats.referrers} label="Referrers" /></div><div className="rounded-lg border p-4"><h2 className="mb-3 font-semibold">Devices</h2><BucketBars data={stats.devices} label="Devices" /></div></div>
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
		<section className="grid gap-3 rounded-lg border p-4">
			<h2 className="font-semibold">Edit link</h2>
			<label className="grid gap-1 text-sm font-medium">Title<Input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
			<label className="grid gap-1 text-sm font-medium">Destination<Input value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} /></label>
			<TagInput value={tags} suggestions={link.tags} onChange={setTags} />
			<label className="grid gap-1 text-sm font-medium">Preview title<Input value={previewTitle} onChange={(event) => setPreviewTitle(event.target.value)} /></label>
			<label className="grid gap-1 text-sm font-medium">Preview description<Textarea value={previewDescription} onChange={(event) => setPreviewDescription(event.target.value)} /></label>
			<div className="flex flex-wrap gap-2">
				<Button onClick={() => onSave({ title, destinationUrl, tags, previewTitle: previewTitle || null, previewDescription: previewDescription || null })}><Save />Save</Button>
				<Button asChild variant="outline"><label><ImageUp />Image<input className="sr-only" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} /></label></Button>
			</div>
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
