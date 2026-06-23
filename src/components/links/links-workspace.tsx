"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart3, Copy, ExternalLink, ImageUp, RefreshCw, Save, Trash2 } from "lucide-react";
import type { LinkStats, ShortLink } from "@/db/repositories/links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabButton, TabsList } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LinkQr, shortLinkUrl } from "./link-qr";

type LinkView = Omit<ShortLink, "createdAt" | "updatedAt"> & { createdAt: Date | string; updatedAt: Date | string };
type StatsView = Omit<LinkStats, "link"> & { link: LinkView };

type LinksWorkspaceProps = {
	initialLinks: LinkView[];
	canModerate: boolean;
};

export function LinksWorkspace({ initialLinks, canModerate }: LinksWorkspaceProps) {
	const [links, setLinks] = useState(initialLinks);
	const [activeId, setActiveId] = useState(initialLinks[0]?.id ?? "");
	const [tab, setTab] = useState<"details" | "stats" | "qr">("details");
	const [origin, setOrigin] = useState("");
	const [status, setStatus] = useState("");
	const [stats, setStats] = useState<StatsView | null>(null);
	const [form, setForm] = useState({ slug: "", destinationUrl: "", title: "" });

	useEffect(() => {
		const id = window.setTimeout(() => setOrigin(window.location.origin), 0);
		return () => window.clearTimeout(id);
	}, []);

	const active = useMemo(() => links.find((link) => link.id === activeId) ?? links[0] ?? null, [activeId, links]);
	const publicUrl = active && origin ? shortLinkUrl(origin, active.slug) : "";

	async function refresh() {
		const response = await fetch("/api/links", { credentials: "same-origin" });
		const body = await response.json() as { links: LinkView[] };
		setLinks(body.links);
		setActiveId((current) => current || body.links[0]?.id || "");
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
		setActiveId(body.link.id);
		setForm({ slug: "", destinationUrl: "", title: "" });
		setStatus("Link created.");
	}

	async function updateLink(patch: Partial<LinkView>) {
		if (!active) return;
		const response = await fetch(`/api/links/${encodeURIComponent(active.id)}`, {
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

	async function removeLink(id: string) {
		const response = await fetch(`/api/links/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
		if (!response.ok) {
			setStatus("Could not delete link.");
			return;
		}
		const next = links.filter((link) => link.id !== id);
		setLinks(next);
		setActiveId(next[0]?.id ?? "");
		setStatus("Link deleted.");
	}

	async function loadStats(id = active?.id) {
		if (!id) return;
		const response = await fetch(`/api/links/${encodeURIComponent(id)}/stats`, { credentials: "same-origin" });
		if (!response.ok) {
			const body = await response.json() as { error?: string };
			setStatus(body.error ?? "Could not load stats.");
			return;
		}
		const body = await response.json() as StatsView;
		setStats(body);
		setTab("stats");
	}

	async function uploadPreview(file: File) {
		if (!active) return;
		const body = new FormData();
		body.set("purpose", "link_preview");
		body.set("linkId", active.id);
		body.set("file", file);
		const response = await fetch("/api/uploads", { method: "POST", credentials: "same-origin", body });
		const result = await response.json() as { key?: string; error?: string };
		if (!response.ok || !result.key) {
			setStatus(result.error ?? "Could not upload image.");
			return;
		}
		await updateLink({ previewImageKey: result.key });
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

			<form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_2fr_1fr_auto]" onSubmit={createLink}>
				<Input placeholder="slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} required />
				<Input
					placeholder="https://example.com"
					value={form.destinationUrl}
					onChange={(event) => setForm({ ...form, destinationUrl: event.target.value })}
					required
				/>
				<Input placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
				<Button type="submit">
					<Save />
					Create
				</Button>
			</form>

			{status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

			<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
				<div className="grid gap-3">
					{links.map((link) => (
						<Card key={link.id} className={active?.id === link.id ? "border-primary" : undefined}>
							<CardHeader className="gap-3 md:flex-row md:items-start md:justify-between md:space-y-0">
								<div className="min-w-0">
									<CardTitle className="truncate">{link.title}</CardTitle>
									<p className="mt-1 truncate text-sm text-muted-foreground">/l/{link.slug}</p>
								</div>
								<div className="flex shrink-0 flex-wrap gap-2">
									<Button variant="outline" size="sm" onClick={() => setActiveId(link.id)}>
										Edit
									</Button>
									<Button variant="outline" size="icon" aria-label="View analytics" onClick={() => loadStats(link.id)}>
										<BarChart3 />
									</Button>
									<Button variant="outline" size="icon" aria-label="Copy link" onClick={() => origin && navigator.clipboard.writeText(shortLinkUrl(origin, link.slug))}>
										<Copy />
									</Button>
									<Button asChild variant="outline" size="icon" aria-label="Open destination">
										<a href={link.destinationUrl} target="_blank" rel="noreferrer">
											<ExternalLink />
										</a>
									</Button>
									<Button variant="ghost" size="icon" aria-label="Delete link" onClick={() => removeLink(link.id)}>
										<Trash2 />
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
									<Badge variant="secondary">{link.clickCount} clicks</Badge>
									<span className="break-all">{link.destinationUrl}</span>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				<div className="rounded-lg border bg-card p-4">
					{active ? (
						<div className="grid gap-4">
							<TabsList>
								<TabButton active={tab === "details"} onClick={() => setTab("details")}>Details</TabButton>
								<TabButton active={tab === "stats"} onClick={() => loadStats(active.id)}>Stats</TabButton>
								<TabButton active={tab === "qr"} onClick={() => setTab("qr")}>QR</TabButton>
							</TabsList>

							{tab === "details" ? <DetailsPanel key={active.id} link={active} onSave={updateLink} onUpload={uploadPreview} /> : null}
							{tab === "stats" ? <StatsPanel stats={stats} /> : null}
							{tab === "qr" && publicUrl ? <LinkQr url={publicUrl} /> : null}
						</div>
					) : (
						<p className="text-sm text-muted-foreground">No links yet.</p>
					)}
				</div>
			</div>
		</div>
	);
}

function DetailsPanel({ link, onSave, onUpload }: { link: LinkView; onSave(patch: Partial<LinkView>): void; onUpload(file: File): void }) {
	const [title, setTitle] = useState(link.title);
	const [destinationUrl, setDestinationUrl] = useState(link.destinationUrl);
	const [previewTitle, setPreviewTitle] = useState(link.previewTitle ?? "");
	const [previewDescription, setPreviewDescription] = useState(link.previewDescription ?? "");

	return (
		<div className="grid gap-3">
			<Input value={title} onChange={(event) => setTitle(event.target.value)} />
			<Input value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} />
			<Input value={previewTitle} placeholder="Preview title" onChange={(event) => setPreviewTitle(event.target.value)} />
			<Textarea value={previewDescription} placeholder="Preview description" onChange={(event) => setPreviewDescription(event.target.value)} />
			<div className="flex flex-wrap gap-2">
				<Button
					onClick={() =>
						onSave({
							title,
							destinationUrl,
							previewTitle: previewTitle || null,
							previewDescription: previewDescription || null,
						})
					}
				>
					<Save />
					Save
				</Button>
				<Button asChild variant="outline">
					<label>
						<ImageUp />
						Image
						<input className="sr-only" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} />
					</label>
				</Button>
			</div>
		</div>
	);
}

function StatsPanel({ stats }: { stats: StatsView | null }) {
	if (!stats) return <p className="text-sm text-muted-foreground">Loading stats.</p>;
	return (
		<div className="grid gap-4 text-sm">
			<StatsList title="Daily" rows={stats.series.map((row) => [row.date, row.count])} />
			<StatsList title="Referrers" rows={stats.referrers.map((row) => [row.bucket, row.count])} />
			<StatsList title="Devices" rows={stats.devices.map((row) => [row.bucket, row.count])} />
		</div>
	);
}

function StatsList({ title, rows }: { title: string; rows: Array<[string, number]> }) {
	return (
		<div>
			<h2 className="mb-2 text-sm font-semibold">{title}</h2>
			<table className="w-full text-left text-sm">
				<tbody>
					{rows.map(([label, count]) => (
						<tr key={label} className="border-t">
							<td className="py-2 pr-3 text-muted-foreground">{label}</td>
							<td className="py-2 text-right font-medium">{count}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
