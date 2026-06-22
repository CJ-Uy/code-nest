import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getRepositories } from "@/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinkQrCustomizer } from "@/components/links/link-qr-customizer";
import { shortLinkUrl } from "@/components/links/urls";
import { requireActor } from "@/server/auth/actor";
import { getAppConfig } from "@/server/env";
import type { LinkStats } from "@/db/repositories/links";

export const dynamic = "force-dynamic";

function Bars({ data, label }: { data: Array<{ key: string; count: number }>; label: string }) {
	const max = Math.max(1, ...data.map((d) => d.count));
	if (data.length === 0) {
		return <p className="text-sm text-muted-foreground">No {label} data yet.</p>;
	}
	return (
		<ul className="grid gap-2">
			{data.map((row) => (
				<li key={row.key} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-sm">
					<span className="truncate text-muted-foreground" title={row.key}>
						{row.key}
					</span>
					<span className="h-2.5 overflow-hidden rounded-full bg-secondary">
						<span className="block h-full rounded-full bg-accent" style={{ width: `${(row.count / max) * 100}%` }} />
					</span>
					<span className="tabular-nums font-medium">{row.count}</span>
				</li>
			))}
		</ul>
	);
}

function TimeSeries({ series }: { series: LinkStats["series"] }) {
	const recent = series.slice(-30);
	const max = Math.max(1, ...recent.map((point) => point.count));
	if (recent.length === 0) {
		return <p className="text-sm text-muted-foreground">No clicks recorded yet.</p>;
	}
	return (
		<div className="flex h-40 items-end gap-1">
			{recent.map((point) => (
				<div key={point.date} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${point.date}: ${point.count}`}>
					<span
						className="w-full rounded-t bg-accent/80"
						style={{ height: `${Math.max(4, (point.count / max) * 100)}%` }}
					/>
				</div>
			))}
		</div>
	);
}

export default async function LinkAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
	const actor = await requireActor();
	const { id } = await params;
	const repositories = await getRepositories();
	const stats = await repositories.links.getStats(actor, id).catch(() => null);
	if (!stats) notFound();

	const config = getAppConfig();
	const origin = config.APP_BASE_URL ?? "https://code.local";
	const url = shortLinkUrl(origin, stats.link.slug);
	const total = stats.series.reduce((sum, point) => sum + point.count, 0);
	const topReferrer = stats.referrers[0]?.bucket ?? "—";
	const topDevice = stats.devices[0]?.bucket ?? "—";

	const tiles = [
		{ label: "Total clicks", value: total },
		{ label: "Days tracked", value: stats.series.length },
		{ label: "Top referrer", value: topReferrer },
		{ label: "Top device", value: topDevice },
	];

	return (
		<div className="grid gap-5">
			<div>
				<Link href="/portal/links" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
					<ArrowLeft className="size-4" />
					Back to links
				</Link>
				<div className="mt-2 flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="font-heading text-3xl">{stats.link.title}</h1>
						<a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
							/l/{stats.link.slug}
							<ExternalLink className="size-3.5" />
						</a>
					</div>
				</div>
			</div>

			<dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				{tiles.map((tile) => (
					<div key={tile.label} className="rounded-xl border border-border bg-card p-4">
						<dt className="text-xs text-muted-foreground">{tile.label}</dt>
						<dd className="mt-1 truncate font-heading text-2xl text-foreground">{tile.value}</dd>
					</div>
				))}
			</dl>

			<div className="grid gap-5 lg:grid-cols-[1fr_320px]">
				<div className="grid gap-5">
					<Card>
						<CardHeader>
							<CardTitle>Clicks over time</CardTitle>
							<CardDescription>Last {Math.min(30, stats.series.length)} days with activity.</CardDescription>
						</CardHeader>
						<CardContent>
							<TimeSeries series={stats.series} />
						</CardContent>
					</Card>
					<div className="grid gap-5 sm:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Referrers</CardTitle>
							</CardHeader>
							<CardContent>
								<Bars label="referrer" data={stats.referrers.map((r) => ({ key: r.bucket, count: r.count }))} />
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-base">Devices</CardTitle>
							</CardHeader>
							<CardContent>
								<Bars label="device" data={stats.devices.map((d) => ({ key: d.bucket, count: d.count }))} />
							</CardContent>
						</Card>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>QR code</CardTitle>
						<CardDescription>Download a customized QR for this short link.</CardDescription>
					</CardHeader>
					<CardContent>
						<LinkQrCustomizer url={url} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
