type Point = { date: string; count: number };
type Bucket = { bucket: string; count: number };

function maxCount(rows: Array<{ count: number }>): number {
	return Math.max(1, ...rows.map((row) => row.count));
}

// Turn stored bucket tokens (direct, qr scan, mobile, …) into friendly display labels.
export function formatBucket(bucket: string): string {
	if (bucket === "qr scan") return "QR code scanned";
	if (bucket === "direct") return "Direct link";
	return bucket.charAt(0).toUpperCase() + bucket.slice(1);
}

function ChartEmpty({ children }: { children: string }) {
	return <p className="rounded-md border bg-card p-6 text-center text-sm text-muted-foreground">{children}</p>;
}

export function ClicksOverTime({ data }: { data: Point[] }) {
	if (!data.length) return <ChartEmpty>No clicks tracked yet.</ChartEmpty>;
	const width = 560;
	const height = 180;
	const padY = 16;
	// One data point can't draw a line — flatten it into a level segment so it reads intentionally.
	const rows = data.length === 1 ? [data[0], data[0]] : data;
	const max = maxCount(rows);
	const points = rows.map((row, index) => {
		const x = rows.length === 1 ? width / 2 : (index / (rows.length - 1)) * width;
		const y = height - padY - (row.count / max) * (height - padY * 2);
		return { ...row, x, y, key: `${row.date}-${index}` };
	});
	const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
	const area = `${line} L${points[points.length - 1].x.toFixed(1)},${height} L${points[0].x.toFixed(1)},${height} Z`;
	const gridYs = [padY, height / 2, height - padY];
	return (
		<div className="grid gap-2">
			<div className="relative rounded-md border bg-card p-3 text-primary">
				<svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Clicks over time" className="h-44 w-full overflow-visible">
					<defs>
						<linearGradient id="clicksFill" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
							<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
						</linearGradient>
					</defs>
					{gridYs.map((y) => (
						<line key={y} x1="0" x2={width} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
					))}
					<path d={area} fill="url(#clicksFill)" />
					<path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
					{data.length > 1
						? points.map((point) => <circle key={point.key} cx={point.x} cy={point.y} r="3" fill="currentColor" />)
						: <circle cx={width / 2} cy={points[0].y} r="4.5" fill="currentColor" />}
				</svg>
				<span className="pointer-events-none absolute right-3 top-2 text-xs font-medium text-muted-foreground">peak {max}/day</span>
			</div>
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>{data[0]?.date}</span>
				<span>{data[data.length - 1]?.date}</span>
			</div>
		</div>
	);
}

// Mid-bright hues that stay legible on both the white (light) and navy (dark) card backgrounds.
const DONUT_PALETTE = ["#2DD4BF", "#F59E0B", "#8B5CF6", "#F43F5E", "#38BDF8", "#A3E635"];

export function DonutChart({ data, label }: { data: Bucket[]; label: string }) {
	const total = data.reduce((sum, row) => sum + row.count, 0);
	if (!total) return <ChartEmpty>{`No ${label.toLowerCase()} data yet.`}</ChartEmpty>;
	// Keep it readable: show the top 5 slices and roll the rest into "Other".
	const sorted = [...data].sort((a, b) => b.count - a.count);
	const shown = sorted.length > 6 ? sorted.slice(0, 5) : sorted;
	const rest = sorted.slice(shown.length).reduce((sum, row) => sum + row.count, 0);
	const slices = rest > 0 ? [...shown, { bucket: "Other", count: rest }] : shown;
	const radius = 42;
	const circumference = 2 * Math.PI * radius;
	const segments = slices.map((row, index) => {
		const fraction = row.count / total;
		const preceding = slices.slice(0, index).reduce((sum, earlier) => sum + earlier.count, 0) / total;
		return { ...row, color: DONUT_PALETTE[index % DONUT_PALETTE.length], dash: fraction * circumference, offset: preceding * circumference, pct: Math.round(fraction * 100) };
	});
	return (
		<div className="flex items-center gap-4" aria-label={label}>
			<svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" role="img" aria-label={label}>
				<circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="16" className="text-muted-foreground" />
				{segments.map((segment) => (
					<circle key={segment.bucket} cx="50" cy="50" r={radius} fill="none" stroke={segment.color} strokeWidth="16" strokeDasharray={`${segment.dash.toFixed(2)} ${(circumference - segment.dash).toFixed(2)}`} strokeDashoffset={-segment.offset} />
				))}
			</svg>
			<ul className="grid min-w-0 flex-1 gap-1 text-sm">
				{segments.map((segment) => (
					<li key={segment.bucket} className="flex items-center gap-2">
						<span className="size-2.5 shrink-0 rounded-full" style={{ background: segment.color }} />
						<span className="truncate text-muted-foreground">{segment.bucket}</span>
						<span className="ml-auto whitespace-nowrap font-medium tabular-nums">{segment.count} · {segment.pct}%</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export function BucketBars({ data, label }: { data: Bucket[]; label: string }) {
	if (!data.length) return <ChartEmpty>{`No ${label.toLowerCase()} data yet.`}</ChartEmpty>;
	const max = maxCount(data);
	return (
		<div className="grid gap-2" aria-label={label}>
			{data.map((row) => (
				<div key={row.bucket} className="grid grid-cols-[minmax(7rem,1fr)_3fr_auto] items-center gap-3 text-sm">
					<span className="truncate text-muted-foreground">{row.bucket}</span>
					<span className="h-2 rounded-full bg-muted">
						<span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }} />
					</span>
					<span className="font-medium tabular-nums">{row.count}</span>
				</div>
			))}
		</div>
	);
}
