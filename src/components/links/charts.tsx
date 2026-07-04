type Point = { date: string; count: number };
type Bucket = { bucket: string; count: number };

function maxCount(rows: Array<{ count: number }>): number {
	return Math.max(1, ...rows.map((row) => row.count));
}

export function ClicksOverTime({ data }: { data: Point[] }) {
	if (!data.length) return <p className="text-sm text-muted-foreground">No clicks tracked yet.</p>;
	const width = 560;
	const height = 180;
	const max = maxCount(data);
	const points = data.map((row, index) => {
		const x = data.length === 1 ? width / 2 : (index / (data.length - 1)) * width;
		const y = height - (row.count / max) * (height - 20) - 10;
		return { ...row, x, y };
	});
	const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
	const area = `${path} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
	return (
		<div className="grid gap-2">
			<svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Clicks over time" className="h-44 w-full overflow-visible rounded-md border bg-white p-2">
				<path d={area} fill="#D7DFE9" />
				<path d={path} fill="none" stroke="#0C315C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
				{points.map((point) => <circle key={point.date} cx={point.x} cy={point.y} r="3" fill="#06192F" />)}
			</svg>
			<div className="flex justify-between text-xs text-muted-foreground">
				<span>{data[0]?.date}</span>
				<span>{data[data.length - 1]?.date}</span>
			</div>
		</div>
	);
}

export function BucketBars({ data, label }: { data: Bucket[]; label: string }) {
	if (!data.length) return <p className="text-sm text-muted-foreground">No {label.toLowerCase()} data yet.</p>;
	const max = maxCount(data);
	return (
		<div className="grid gap-2" aria-label={label}>
			{data.map((row) => (
				<div key={row.bucket} className="grid grid-cols-[minmax(7rem,1fr)_3fr_auto] items-center gap-3 text-sm">
					<span className="truncate text-muted-foreground">{row.bucket}</span>
					<span className="h-2 rounded-full bg-secondary">
						<span className="block h-full rounded-full bg-[#0C315C]" style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }} />
					</span>
					<span className="font-medium tabular-nums">{row.count}</span>
				</div>
			))}
		</div>
	);
}
